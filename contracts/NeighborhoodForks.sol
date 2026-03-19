// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { CidadaniaToken } from "./CidadaniaToken.sol";

interface IWeightedVotingForks {
    function getForkEligibility(
        bytes32 proposalId,
        bytes32 neighborhoodId
    ) external view returns (bool eligible, bytes32 lawId);
}

contract NeighborhoodForks is Ownable {
    error CitizenRequired(address account);
    error ForkAlreadyExists(bytes32 forkId);
    error ForkNotFound(bytes32 forkId);
    error LawForkAlreadyExists(bytes32 lawId, bytes32 neighborhoodId);
    error ProposalNotApprovedForFork(bytes32 proposalId, bytes32 neighborhoodId);
    error SlugRequired();

    struct ForkRecord {
        bytes32 id;
        bytes32 proposalId;
        bytes32 lawId;
        bytes32 forkLawId;
        bytes32 neighborhoodId;
        string slug;
        string objectiveHash;
        address author;
        uint64 createdAt;
        bool active;
        bool exists;
    }

    CidadaniaToken public immutable citizenship;
    IWeightedVotingForks public immutable voting;

    bytes32[] private _forkIds;
    mapping(bytes32 => ForkRecord) private _forks;
    mapping(bytes32 => bytes32) private _forkIdByProposal;
    mapping(bytes32 => mapping(bytes32 => bytes32)) private _forkIdByLawAndNeighborhood;

    event ForkCreated(
        bytes32 indexed forkId,
        bytes32 indexed proposalId,
        bytes32 indexed lawId,
        bytes32 forkLawId,
        bytes32 neighborhoodId,
        address author
    );
    event ForkStatusUpdated(bytes32 indexed forkId, bool active);

    constructor(address citizenshipAddress, address votingAddress) Ownable(msg.sender) {
        citizenship = CidadaniaToken(citizenshipAddress);
        voting = IWeightedVotingForks(votingAddress);
    }

    function createFork(
        bytes32 forkId,
        bytes32 proposalId,
        bytes32 neighborhoodId,
        bytes32 forkLawId,
        string calldata slug,
        string calldata objectiveHash
    ) external {
        if (_forks[forkId].exists) {
            revert ForkAlreadyExists(forkId);
        }
        if (bytes(slug).length == 0) {
            revert SlugRequired();
        }
        if (!citizenship.isCitizenActive(msg.sender)) {
            revert CitizenRequired(msg.sender);
        }
        if (citizenship.bairroOf(msg.sender) != neighborhoodId) {
            revert CitizenRequired(msg.sender);
        }

        (bool eligible, bytes32 lawId) = voting.getForkEligibility(
            proposalId,
            neighborhoodId
        );
        if (!eligible) {
            revert ProposalNotApprovedForFork(proposalId, neighborhoodId);
        }
        if (_forkIdByLawAndNeighborhood[lawId][neighborhoodId] != bytes32(0)) {
            revert LawForkAlreadyExists(lawId, neighborhoodId);
        }

        _forks[forkId] = ForkRecord({
            id: forkId,
            proposalId: proposalId,
            lawId: lawId,
            forkLawId: forkLawId,
            neighborhoodId: neighborhoodId,
            slug: slug,
            objectiveHash: objectiveHash,
            author: msg.sender,
            createdAt: uint64(block.timestamp),
            active: true,
            exists: true
        });

        _forkIds.push(forkId);
        _forkIdByProposal[proposalId] = forkId;
        _forkIdByLawAndNeighborhood[lawId][neighborhoodId] = forkId;

        emit ForkCreated(
            forkId,
            proposalId,
            lawId,
            forkLawId,
            neighborhoodId,
            msg.sender
        );
    }

    function setForkActive(bytes32 forkId, bool active) external onlyOwner {
        ForkRecord storage fork = _requireFork(forkId);
        fork.active = active;
        emit ForkStatusUpdated(forkId, active);
    }

    function getFork(bytes32 forkId) external view returns (ForkRecord memory) {
        return _requireFork(forkId);
    }

    function getForkIds() external view returns (bytes32[] memory) {
        return _forkIds;
    }

    function getForkIdByProposal(bytes32 proposalId) external view returns (bytes32) {
        return _forkIdByProposal[proposalId];
    }

    function getForkIdForLawAndNeighborhood(
        bytes32 lawId,
        bytes32 neighborhoodId
    ) external view returns (bytes32) {
        return _forkIdByLawAndNeighborhood[lawId][neighborhoodId];
    }

    function _requireFork(
        bytes32 forkId
    ) internal view returns (ForkRecord storage fork) {
        fork = _forks[forkId];
        if (!fork.exists) {
            revert ForkNotFound(forkId);
        }
    }
}
