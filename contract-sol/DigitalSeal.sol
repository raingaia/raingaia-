// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DigitalSeal {
    
    // Mühürün Yapısı: Kimlik, Durum ve Zaman
    struct Seal {
        string sealHash;    // Oracle'dan gelen benzersiz hash
        bool isValid;       // Ürün güvenli mi?
        uint256 timestamp;  // Ne zaman mühürlendi?
        string location;    // Hangi koordinatta?
    }

    // Hash => Mühür Eşleşmesi
    mapping(string => Seal) public seals;
    
    // Olay Günlüğü (Dashboard'da göreceğiz)
    event SealCreated(string indexed sealHash, uint256 timestamp);
    event SealRevoked(string indexed sealHash, string reason);

    address public owner;

    constructor() {
        owner = msg.sender; // Kontratı başlatan biziz (Admin)
    }

    // 1. Mühürü Zincire Çakma Fonksiyonu
    function mintSeal(string memory _sealHash, string memory _location) public {
        require(msg.sender == owner, "Yetkisiz islem!");
        require(seals[_sealHash].timestamp == 0, "Bu urun zaten muhurlu!");

        seals[_sealHash] = Seal({
            sealHash: _sealHash,
            isValid: true,
            timestamp: block.timestamp,
            location: _location
        });

        emit SealCreated(_sealHash, block.timestamp);
    }

    // 2. Mühür Kontrolü (Son Kullanıcı İçin)
    function verifySeal(string memory _sealHash) public view returns (bool, uint256, string memory) {
        Seal memory s = seals[_sealHash];
        return (s.isValid, s.timestamp, s.location);
    }

    // 3. Acil Durum Butonu (Eğer sonradan bir sorun çıkarsa)
    function revokeSeal(string memory _sealHash, string memory _reason) public {
        require(msg.sender == owner, "Yetkisiz islem!");
        seals[_sealHash].isValid = false;
        emit SealRevoked(_sealHash, _reason);
    }
}
