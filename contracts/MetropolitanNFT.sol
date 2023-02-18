// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MetropolitanNFT is Initializable, ERC721Upgradeable, PausableUpgradeable, 
                        AccessControlUpgradeable, UUPSUpgradeable{

    mapping (address => uint256[]) NFTsMinteados;
    mapping (uint256 => address) vendidoNFT;
    uint256[] NftsActuales;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    string uriNFT;
    uint256 maxIdNFT;
    
   /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _name,
        string memory _symbol
        ) public initializer {
        __ERC721_init(_name, _symbol);
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        maxIdNFT = 118;
    }

    function setMaxIdNFT(uint256 newMaxId) external onlyRole(DEFAULT_ADMIN_ROLE){
        maxIdNFT = newMaxId;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmQXz7mxcrzNaM2uAmPt4TJyPBrDHJ6yYA7vcpmfSCkLbC/";
    }

    function tokenURI( uint256 tokenId ) public view override returns (string memory) {
        require( _exists(tokenId), "Metropolitan NFT: Consulta de URI para token inexistente" );

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json"))
                : "";
    }

    function pause() public onlyRole(PAUSER_ROLE){
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE){
        _unpause();
    }

    function safeMint(address addressTo, uint256 idNFT) public onlyRole(MINTER_ROLE){
        // Validar address
        require(addressTo != address(0), "Metropolitan NFT: Address a mintear es invalido");

        // Validar # de id minimo y maximo
        require((idNFT > 0) && (idNFT < (maxIdNFT+1)), "Metropolitan NFT: El id esta fuera del rango permitido");

        // Validar id esta disponible
        require(vendidoNFT[idNFT] == address(0), "Metropolitan NFT: NFT ya fue minteado a otra address");

        vendidoNFT[idNFT] = addressTo;    
        NFTsMinteados[addressTo].push(idNFT);
        _safeMint(addressTo, idNFT);
    }

    function obtenerNFTs(address dueno) public view returns (uint256[] memory) {        
        return NFTsMinteados[dueno]; 
    }

    function safeBurn(address dueno, uint256 idNFT) public onlyRole(BURNER_ROLE){
        // Validar el address
        require(dueno != address(0), "Metropolitan NFT: Address a burnear es invalido");
        // Validar el id
        require((idNFT > 0) && (idNFT < (maxIdNFT+1)), "Metropolitan NFT: El id esta fuera del rango permitido");
        // Validar dueno
        require(vendidoNFT[idNFT] == dueno, "Metropolitan NFT: El address dueno es otro distinto");

        delete vendidoNFT[idNFT];
        for(uint256 i = 0; i < NFTsMinteados[dueno].length; i++){
            if(NFTsMinteados[dueno][i] != idNFT){
                NftsActuales.push(NFTsMinteados[dueno][i]);
                break;
            }
        }
        NFTsMinteados[dueno] = NftsActuales;

        _burn(idNFT);        
    }
    
    function supportsInterface(bytes4 interfaceId)
        public view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(MINTER_ROLE) {}
}
