// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { CidadaniaToken } from "./CidadaniaToken.sol";

contract WeightedVoting is Ownable {
    error AlreadyVoted(bytes32 proposalId, address voter);
    error CitizenRequired(address voter);
    error EmptyNeighborhoods();
    error InvalidDeadline(uint64 votingEndsAt);
    error InvalidProposalId();
    error InvalidVoteChoice();
    error ProposalAlreadyExists(bytes32 proposalId);
    error ProposalAlreadyFinalized(bytes32 proposalId);
    error ProposalClosed(bytes32 proposalId);
    error ProposalNotFound(bytes32 proposalId);
    error VotingStillOpen(bytes32 proposalId);

    uint256 public constant IMPACTED_WEIGHT = 100;
    uint256 public constant ADJACENT_WEIGHT = 60;
    uint256 public constant GLOBAL_WEIGHT = 30;

    enum ProposalKind {
        Municipal,
        NeighborhoodFork
    }

    enum VoteChoice {
        None,
        Favor,
        Contra,
        Abster
    }

    struct Proposal {
        bytes32 id;
        bytes32 lawId;
        bytes32 proposerNeighborhoodId;
        address proposer;
        ProposalKind kind;
        uint64 createdAt;
        uint64 votingEndsAt;
        uint256 quorum;
        uint256 favor;
        uint256 contra;
        uint256 abster;
        bool finalized;
        bool approved;
        bool exists;
        bytes32[] impactedNeighborhoodIds;
        bytes32[] adjacentNeighborhoodIds;
    }

    struct VoteRecord {
        VoteChoice choice;
        uint256 weight;
        bytes32 neighborhoodId;
        bool exists;
    }

    CidadaniaToken public immutable citizenship;

    mapping(bytes32 => Proposal) private _proposals;
    mapping(bytes32 => mapping(address => VoteRecord)) private _votes;

    event ProposalCreated(
        bytes32 indexed proposalId,
        bytes32 indexed lawId,
        ProposalKind kind,
        address proposer,
        uint64 votingEndsAt,
        uint256 quorum
    );
    event ProposalFinalized(bytes32 indexed proposalId, bool approved, uint256 totalWeight);
    event VoteCast(
        bytes32 indexed proposalId,
        address indexed voter,
        VoteChoice choice,
        uint256 weight,
        bytes32 neighborhoodId
    );

    constructor(address citizenshipAddress) Ownable(msg.sender) {
        citizenship = CidadaniaToken(citizenshipAddress);
    }

    function createProposal(
        bytes32 proposalId,
        bytes32 lawId,
        bytes32 proposerNeighborhoodId,
        bytes32[] calldata impactedNeighborhoodIds,
        bytes32[] calldata adjacentNeighborhoodIds,
        uint64 votingEndsAt,
        uint256 quorum,
        ProposalKind kind
    ) external {
        if (proposalId == bytes32(0)) {
            revert InvalidProposalId();
        }
        if (_proposals[proposalId].exists) {
            revert ProposalAlreadyExists(proposalId);
        }
        if (impactedNeighborhoodIds.length == 0) {
            revert EmptyNeighborhoods();
        }
        if (votingEndsAt <= block.timestamp) {
            revert InvalidDeadline(votingEndsAt);
        }
        if (!citizenship.isCitizenActive(msg.sender)) {
            revert CitizenRequired(msg.sender);
        }
        if (citizenship.bairroOf(msg.sender) != proposerNeighborhoodId) {
            revert CitizenRequired(msg.sender);
        }

        Proposal storage proposal = _proposals[proposalId];
        proposal.id = proposalId;
        proposal.lawId = lawId;
        proposal.proposerNeighborhoodId = proposerNeighborhoodId;
        proposal.proposer = msg.sender;
        proposal.kind = kind;
        proposal.createdAt = uint64(block.timestamp);
        proposal.votingEndsAt = votingEndsAt;
        proposal.quorum = quorum;
        proposal.exists = true;

        for (uint256 i = 0; i < impactedNeighborhoodIds.length; i++) {
            proposal.impactedNeighborhoodIds.push(impactedNeighborhoodIds[i]);
        }

        for (uint256 i = 0; i < adjacentNeighborhoodIds.length; i++) {
            proposal.adjacentNeighborhoodIds.push(adjacentNeighborhoodIds[i]);
        }

        emit ProposalCreated(
            proposalId,
            lawId,
            kind,
            msg.sender,
            votingEndsAt,
            quorum
        );
    }

    function castVote(bytes32 proposalId, VoteChoice choice) external {
        Proposal storage proposal = _requireProposal(proposalId);
        if (proposal.finalized || block.timestamp >= proposal.votingEndsAt) {
            revert ProposalClosed(proposalId);
        }
        if (choice == VoteChoice.None) {
            revert InvalidVoteChoice();
        }
        if (_votes[proposalId][msg.sender].exists) {
            revert AlreadyVoted(proposalId, msg.sender);
        }
        if (!citizenship.isCitizenActive(msg.sender)) {
            revert CitizenRequired(msg.sender);
        }

        bytes32 neighborhoodId = citizenship.bairroOf(msg.sender);
        uint256 weight = _voteWeightForNeighborhood(proposal, neighborhoodId);

        _votes[proposalId][msg.sender] = VoteRecord({
            choice: choice,
            weight: weight,
            neighborhoodId: neighborhoodId,
            exists: true
        });

        if (choice == VoteChoice.Favor) {
            proposal.favor += weight;
        } else if (choice == VoteChoice.Contra) {
            proposal.contra += weight;
        } else {
            proposal.abster += weight;
        }

        emit VoteCast(proposalId, msg.sender, choice, weight, neighborhoodId);
    }

    function finalizeProposal(bytes32 proposalId) external returns (bool approved) {
        Proposal storage proposal = _requireProposal(proposalId);
        if (proposal.finalized) {
            revert ProposalAlreadyFinalized(proposalId);
        }
        if (block.timestamp < proposal.votingEndsAt) {
            revert VotingStillOpen(proposalId);
        }

        uint256 totalWeight = proposal.favor + proposal.contra + proposal.abster;
        approved = proposal.favor > proposal.contra && totalWeight >= proposal.quorum;

        proposal.finalized = true;
        proposal.approved = approved;

        emit ProposalFinalized(proposalId, approved, totalWeight);
    }

    function getProposal(bytes32 proposalId) external view returns (Proposal memory) {
        Proposal storage proposal = _requireProposal(proposalId);
        return proposal;
    }

    function getVote(bytes32 proposalId, address voter) external view returns (VoteRecord memory) {
        _requireProposal(proposalId);
        return _votes[proposalId][voter];
    }

    function voteWeightFor(bytes32 proposalId, address voter) external view returns (uint256) {
        Proposal storage proposal = _requireProposal(proposalId);
        if (!citizenship.isCitizenActive(voter)) {
            return 0;
        }

        return _voteWeightForNeighborhood(proposal, citizenship.bairroOf(voter));
    }

    function canCreateFork(
        bytes32 proposalId,
        bytes32 neighborhoodId
    ) public view returns (bool) {
        Proposal storage proposal = _requireProposal(proposalId);
        return
            proposal.finalized &&
            proposal.approved &&
            proposal.kind == ProposalKind.NeighborhoodFork &&
            _contains(proposal.impactedNeighborhoodIds, neighborhoodId);
    }

    function getForkEligibility(
        bytes32 proposalId,
        bytes32 neighborhoodId
    ) external view returns (bool eligible, bytes32 lawId) {
        Proposal storage proposal = _requireProposal(proposalId);
        eligible =
            proposal.finalized &&
            proposal.approved &&
            proposal.kind == ProposalKind.NeighborhoodFork &&
            _contains(proposal.impactedNeighborhoodIds, neighborhoodId);
        lawId = proposal.lawId;
    }

    function _requireProposal(
        bytes32 proposalId
    ) internal view returns (Proposal storage proposal) {
        proposal = _proposals[proposalId];
        if (!proposal.exists) {
            revert ProposalNotFound(proposalId);
        }
    }

    function _voteWeightForNeighborhood(
        Proposal storage proposal,
        bytes32 neighborhoodId
    ) internal view returns (uint256) {
        if (_contains(proposal.impactedNeighborhoodIds, neighborhoodId)) {
            return IMPACTED_WEIGHT;
        }
        if (_contains(proposal.adjacentNeighborhoodIds, neighborhoodId)) {
            return ADJACENT_WEIGHT;
        }

        return GLOBAL_WEIGHT;
    }

    function _contains(
        bytes32[] storage values,
        bytes32 target
    ) internal view returns (bool) {
        for (uint256 i = 0; i < values.length; i++) {
            if (values[i] == target) {
                return true;
            }
        }

        return false;
    }
}
