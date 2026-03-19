// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract GitLawRepository is Ownable {
    error CommitAlreadyExists(bytes32 commitId);
    error CommitNotFound(bytes32 commitId);
    error EmptyString();
    error LawAlreadyExists(bytes32 lawId);
    error LawNotFound(bytes32 lawId);
    error UnauthorizedWriter(address account);

    struct Law {
        bytes32 id;
        string numero;
        string titulo;
        string categoria;
        string versaoAtual;
        string contentHash;
        bytes32 baseLawId;
        bytes32 neighborhoodId;
        bool isFork;
        uint64 createdAt;
        uint64 updatedAt;
        bool exists;
    }

    struct CommitData {
        bytes32 id;
        bytes32 lawId;
        bytes32 proposalId;
        string version;
        string message;
        string contentHash;
        address author;
        uint64 createdAt;
    }

    bytes32[] private _lawIds;
    mapping(bytes32 => Law) private _laws;
    mapping(address => bool) private _authorizedWriters;

    mapping(bytes32 => CommitData) private _commits;
    mapping(bytes32 => bool) private _commitExists;
    mapping(bytes32 => bytes32[]) private _commitIdsByLaw;

    event AuthorizedWriterUpdated(address indexed writer, bool allowed);
    event CommitRecorded(
        bytes32 indexed commitId,
        bytes32 indexed lawId,
        bytes32 indexed proposalId,
        address author,
        string version
    );
    event LawRegistered(
        bytes32 indexed lawId,
        string numero,
        string titulo,
        bool isFork,
        bytes32 baseLawId,
        bytes32 neighborhoodId
    );

    constructor() Ownable(msg.sender) {}

    modifier onlyWriter() {
        if (msg.sender != owner() && !_authorizedWriters[msg.sender]) {
            revert UnauthorizedWriter(msg.sender);
        }
        _;
    }

    function setAuthorizedWriter(address writer, bool allowed) external onlyOwner {
        _authorizedWriters[writer] = allowed;
        emit AuthorizedWriterUpdated(writer, allowed);
    }

    function registerLaw(
        bytes32 lawId,
        string calldata numero,
        string calldata titulo,
        string calldata categoria,
        string calldata versaoInicial,
        string calldata contentHash,
        bytes32 baseLawId,
        bytes32 neighborhoodId,
        bool isFork
    ) external onlyWriter {
        if (_laws[lawId].exists) {
            revert LawAlreadyExists(lawId);
        }

        _requireNonEmpty(numero);
        _requireNonEmpty(titulo);
        _requireNonEmpty(categoria);
        _requireNonEmpty(versaoInicial);
        _requireNonEmpty(contentHash);

        _laws[lawId] = Law({
            id: lawId,
            numero: numero,
            titulo: titulo,
            categoria: categoria,
            versaoAtual: versaoInicial,
            contentHash: contentHash,
            baseLawId: baseLawId,
            neighborhoodId: neighborhoodId,
            isFork: isFork,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            exists: true
        });

        _lawIds.push(lawId);

        emit LawRegistered(lawId, numero, titulo, isFork, baseLawId, neighborhoodId);
    }

    function recordCommit(
        bytes32 commitId,
        bytes32 lawId,
        bytes32 proposalId,
        string calldata version,
        string calldata message,
        string calldata contentHash,
        address author
    ) external onlyWriter {
        Law storage law = _requireLaw(lawId);
        if (_commitExists[commitId]) {
            revert CommitAlreadyExists(commitId);
        }

        _requireNonEmpty(version);
        _requireNonEmpty(message);
        _requireNonEmpty(contentHash);

        _commitExists[commitId] = true;
        _commits[commitId] = CommitData({
            id: commitId,
            lawId: lawId,
            proposalId: proposalId,
            version: version,
            message: message,
            contentHash: contentHash,
            author: author,
            createdAt: uint64(block.timestamp)
        });

        _commitIdsByLaw[lawId].push(commitId);
        law.versaoAtual = version;
        law.contentHash = contentHash;
        law.updatedAt = uint64(block.timestamp);

        emit CommitRecorded(commitId, lawId, proposalId, author, version);
    }

    function getLaw(bytes32 lawId) external view returns (Law memory) {
        return _requireLaw(lawId);
    }

    function getLawIds() external view returns (bytes32[] memory) {
        return _lawIds;
    }

    function getCommit(bytes32 commitId) external view returns (CommitData memory) {
        if (!_commitExists[commitId]) {
            revert CommitNotFound(commitId);
        }

        return _commits[commitId];
    }

    function getCommitIdsByLaw(bytes32 lawId) external view returns (bytes32[] memory) {
        _requireLaw(lawId);
        return _commitIdsByLaw[lawId];
    }

    function lawExists(bytes32 lawId) external view returns (bool) {
        return _laws[lawId].exists;
    }

    function _requireLaw(bytes32 lawId) internal view returns (Law storage law) {
        law = _laws[lawId];
        if (!law.exists) {
            revert LawNotFound(lawId);
        }
    }

    function _requireNonEmpty(string calldata value) internal pure {
        if (bytes(value).length == 0) {
            revert EmptyString();
        }
    }
}
