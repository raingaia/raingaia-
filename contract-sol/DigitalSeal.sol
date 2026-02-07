// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DigitalSeal {
    // -------------------------
    // Roles / Access
    // -------------------------
    address public owner;
    mapping(address => bool) public writers;

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyWriter() {
        require(writers[msg.sender] || msg.sender == owner, "NOT_WRITER");
        _;
    }

    // -------------------------
    // Data Model
    // -------------------------
    struct Seal {
        bool exists;
        bool isValid;
        uint64 timestamp;        // block timestamp (seconds)
        string location;         // keep string for demo; can be geohash later
        address writer;          // who minted it
        string revokeReason;     // empty if not revoked
        uint64 revokedAt;        // 0 if not revoked
        address revokedBy;       // address(0) if not revoked
    }

    mapping(bytes32 => Seal) private _seals;

    // -------------------------
    // Events (Dashboard friendly)
    // -------------------------
    event WriterAdded(address indexed writer);
    event WriterRemoved(address indexed writer);

    event SealCreated(
        bytes32 indexed sealHash,
        uint64 timestamp,
        address indexed writer,
        string location
    );

    event SealRevoked(
        bytes32 indexed sealHash,
        uint64 revokedAt,
        address indexed revokedBy,
        string reason
    );

    // -------------------------
    // Constructor
    // -------------------------
    constructor() {
        owner = msg.sender;
        writers[msg.sender] = true;
        emit WriterAdded(msg.sender);
    }

    // -------------------------
    // Admin: manage writers
    // -------------------------
    function addWriter(address w) external onlyOwner {
        require(w != address(0), "ZERO_ADDR");
        require(!writers[w], "ALREADY_WRITER");
        writers[w] = true;
        emit WriterAdded(w);
    }

    function removeWriter(address w) external onlyOwner {
        require(writers[w], "NOT_WRITER");
        writers[w] = false;
        emit WriterRemoved(w);
    }

    // -------------------------
    // Core: mint / verify / revoke
    // -------------------------
    function mintSeal(bytes32 sealHash, string calldata location) external onlyWriter {
        require(sealHash != bytes32(0), "BAD_HASH");
        require(!_seals[sealHash].exists, "ALREADY_MINTED");

        _seals[sealHash] = Seal({
            exists: true,
            isValid: true,
            timestamp: uint64(block.timestamp),
            location: location,
            writer: msg.sender,
            revokeReason: "",
            revokedAt: 0,
            revokedBy: address(0)
        });

        emit SealCreated(sealHash, uint64(block.timestamp), msg.sender, location);
    }

    function verifySeal(bytes32 sealHash)
        external
        view
        returns (
            bool exists,
            bool isValid,
            uint64 timestamp,
            string memory location,
            address writer,
            uint64 revokedAt,
            address revokedBy,
            string memory revokeReason
        )
    {
        Seal memory s = _seals[sealHash];
        return (
            s.exists,
            s.isValid,
            s.timestamp,
            s.location,
            s.writer,
            s.revokedAt,
            s.revokedBy,
            s.revokeReason
        );
    }

    function revokeSeal(bytes32 sealHash, string calldata reason) external onlyOwner {
        Seal storage s = _seals[sealHash];
        require(s.exists, "NOT_FOUND");
        require(s.isValid, "ALREADY_REVOKED");

        s.isValid = false;
        s.revokedAt = uint64(block.timestamp);
        s.revokedBy = msg.sender;
        s.revokeReason = reason;

        emit SealRevoked(sealHash, uint64(block.timestamp), msg.sender, reason);
    }

    // Optional: quick getter (cheaper for dashboards)
    function getSeal(bytes32 sealHash) external view returns (Seal memory) {
        return _seals[sealHash];
    }

    // Optional: transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDR");
        owner = newOwner;
        writers[newOwner] = true;
        emit WriterAdded(newOwner);
    }
}
