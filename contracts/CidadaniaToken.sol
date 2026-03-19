// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CidadaniaToken is ERC721, Ownable {
    error CitizenAlreadyActive(address citizen);
    error CitizenNotFound(address citizen);
    error InvalidCitizenAddress();
    error NonTransferable();

    struct Citizenship {
        uint256 tokenId;
        bytes32 bairroId;
        uint256 nivel;
        uint64 issuedAt;
        bool active;
    }

    uint256 private _nextTokenId = 1;
    string private _baseTokenUri;

    mapping(address => Citizenship) private _citizenships;

    event CitizenMinted(
        address indexed citizen,
        uint256 indexed tokenId,
        bytes32 indexed bairroId,
        uint256 nivel
    );
    event CitizenRevoked(address indexed citizen, uint256 indexed tokenId);
    event BaseUriUpdated(string newBaseTokenUri);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenUri_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _baseTokenUri = baseTokenUri_;
    }

    function mintCitizen(
        address citizen,
        bytes32 bairroId,
        uint256 nivel
    ) external onlyOwner returns (uint256 tokenId) {
        if (citizen == address(0)) {
            revert InvalidCitizenAddress();
        }

        Citizenship storage existing = _citizenships[citizen];
        if (existing.active) {
            revert CitizenAlreadyActive(citizen);
        }

        tokenId = _nextTokenId;
        _nextTokenId += 1;

        _safeMint(citizen, tokenId);

        _citizenships[citizen] = Citizenship({
            tokenId: tokenId,
            bairroId: bairroId,
            nivel: nivel,
            issuedAt: uint64(block.timestamp),
            active: true
        });

        emit CitizenMinted(citizen, tokenId, bairroId, nivel);
    }

    function revokeCitizen(address citizen) external onlyOwner {
        Citizenship storage citizenship = _citizenships[citizen];
        if (!citizenship.active) {
            revert CitizenNotFound(citizen);
        }

        uint256 tokenId = citizenship.tokenId;
        citizenship.active = false;
        _burn(tokenId);

        emit CitizenRevoked(citizen, tokenId);
    }

    function setBaseTokenUri(string calldata newBaseTokenUri) external onlyOwner {
        _baseTokenUri = newBaseTokenUri;
        emit BaseUriUpdated(newBaseTokenUri);
    }

    function citizenshipOf(address citizen) external view returns (Citizenship memory) {
        return _citizenships[citizen];
    }

    function bairroOf(address citizen) external view returns (bytes32) {
        return _citizenships[citizen].bairroId;
    }

    function isCitizenActive(address citizen) external view returns (bool) {
        return _citizenships[citizen].active;
    }

    function approve(address, uint256) public pure override {
        revert NonTransferable();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert NonTransferable();
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert NonTransferable();
        }

        return super._update(to, tokenId, auth);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenUri;
    }
}
