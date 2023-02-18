// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMetropolitanSwap {
    function swapExactTokensForTokens(
        uint amountIn,
        address _sender
    ) external returns (uint[] memory amounts);
}

contract MetroRecharge is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERC20 tokenPEN;
    IMetropolitanSwap swapper;

    uint256 limiteRecargaComun;
    uint256 limiteRecargaLeg;

    uint256 constant MIN_NFT_COMUN = 1;
    uint256 constant MAX_NFT_COMUN = 100;
    uint256 idNftComunDisponible;
    uint256 constant MIN_NFT_LEGENDARIO = 101;
    uint256 constant MAX_NFT_LEGENDARIO = 118;
    uint256 idNftLegendarioDisponible;

    event GiftNFT(address winnerAccount, uint256 nftId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _penAddress,
        address _swapperAddress
    ) public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        limiteRecargaComun = 50;
        limiteRecargaLeg = 100;
        tokenPEN = IERC20(_penAddress);
        swapper = IMetropolitanSwap(_swapperAddress);

        idNftComunDisponible = 1;
        idNftLegendarioDisponible = 101;
    }

    function setLimitePremioNFTComun(
        uint256 _limite
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_limite > 0, "Limite para comun no puede ser menor que cero");
        require(
            _limite < limiteRecargaLeg,
            "Limite para comun no puede ser mayor al del legendario"
        );
        limiteRecargaComun = _limite;
    }

    function setLimitePremioNFTLegendario(
        uint256 _limite
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            _limite > 0,
            "Limite para legendario no puede ser menor que cero"
        );
        require(
            _limite > limiteRecargaComun,
            "Limite para legendario no puede ser menor al del comun"
        );
        limiteRecargaLeg = _limite;
    }

    function comprarMtptkPorPEN(uint amountPEN) public {
        uint256 balancePEN = tokenPEN.balanceOf(msg.sender);
        require(
            balancePEN >= amountPEN,
            "No tiene suficiente PEN para realizar la transaccion"
        );

        swapper.swapExactTokensForTokens(amountPEN, msg.sender);

        if (amountPEN >= limiteRecargaLeg * 10 ** 2) {
            if (idNftLegendarioDisponible < MAX_NFT_LEGENDARIO) {
                emit GiftNFT(msg.sender, idNftLegendarioDisponible);
                idNftLegendarioDisponible++;
            }
        } else if (amountPEN >= limiteRecargaComun * 10 ** 2) {
            if (idNftComunDisponible < MAX_NFT_COMUN) {
                emit GiftNFT(msg.sender, idNftComunDisponible);
                idNftComunDisponible++;
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}
}
