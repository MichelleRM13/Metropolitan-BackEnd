const { expect } = require("chai");
const { ethers } = require("hardhat");

const { getRole, deploySC, pEth } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");


describe("METROPOLITAN SC TESTING", function () {
  var nftContract;
  var owner, alice, bob, carl, deysi;
  var nameNFT = "MetropolitanNFT";
  var symbolNFT = "MTPNFT";

  before(async () => {
    [owner, alice, bob, carl, deysi] = await ethers.getSigners();
  });

  async function deployNFTSC() {
    nftContract = await deploySC("MetropolitanNFT", [nameNFT, symbolNFT]);
  }

  describe("NFT Gifts Smart Contract", () => {
    beforeEach(async () => {
      await deployNFTSC();
    });

    it("Verifica nombre colección", async () => {
      var nameColleccion = await nftContract.name();
      expect( nameColleccion ).to.be.equal( nameNFT );
    });

    it("Verifica símbolo de colección", async () => {
      var symbolColleccion = await nftContract.symbol();

      expect( symbolColleccion ).to.be.equal( symbolNFT );
    });

    it("No permite acuñar sin privilegio", async () => {
      var NFTId = 13;
      const safeMint = nftContract.connect(deysi).functions["safeMint(address,uint256)"];

      await expect( safeMint(deysi.address, NFTId) )
      .to.revertedWith(
        `AccessControl: account ${deysi.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("No permite acuñar a address zero", async () => {
      var addressZero = "0x0000000000000000000000000000000000000000";
      var NFTId = 13;
      await nftContract.grantRole(MINTER_ROLE, deysi.address);
      await nftContract.grantRole(MINTER_ROLE, addressZero);
      const safeMint = nftContract.connect(deysi).functions["safeMint(address,uint256)"];

      await expect( safeMint(addressZero, NFTId) )
      .to.revertedWith(
        "Metropolitan NFT: Address a mintear es invalido"
      );
    });

    it("Verifica rango de Nft: [1, 118]", async () => {
      var NFTId = 0;
      const safeMint = nftContract.connect(owner).functions["safeMint(address,uint256)"];

      await expect( safeMint(alice.address, NFTId) )
      .to.revertedWith(
        "Metropolitan NFT: El id esta fuera del rango permitido"
      );
    });

    it("No permite acuñar id de Nft por segunda vez", async () => {
      var NFTId = 4;
      await nftContract.grantRole(MINTER_ROLE, carl.address);
      const safeMint = nftContract.connect(owner).functions["safeMint(address,uint256)"];

      await expect( safeMint(bob.address, NFTId) )
      .to.changeTokenBalance(
        nftContract, bob.address, 1
      );
 
      await expect( safeMint(carl.address, NFTId) )
      .to.revertedWith(
        "Metropolitan NFT: NFT ya fue minteado a otra address"
      );
    });

    it("No permite hacer burn de un id que no le pertenece", async () => {
      var NFTId = 8;
      await nftContract.grantRole(MINTER_ROLE, bob.address);
      await nftContract.grantRole(BURNER_ROLE, carl.address);
      const safeMint = nftContract.connect(owner).functions["safeMint(address,uint256)"];

      await expect( safeMint(bob.address, NFTId) )
      .to.changeTokenBalance(
        nftContract, bob.address, 1
      );

      const safeBurn = nftContract.connect(owner).functions["safeBurn(address,uint256)"];
 
      await expect( safeBurn(carl.address, NFTId) )
      .to.revertedWith(
        "Metropolitan NFT: El address dueno es otro distinto"
      );
    });

    it("Se pueden acuñar todos los 118 Nfts", async () => {
      var addressZero = "0x0000000000000000000000000000000000000000";
      await nftContract.grantRole(MINTER_ROLE, deysi.address);
      const safeMint = nftContract.connect(owner).functions["safeMint(address,uint256)"];

      for(var contador = 1; contador < 119; contador++){
        var tx = await safeMint(deysi.address, contador);
        
        await expect( tx )
        .to.emit(
          nftContract, "Transfer"
        ).withArgs(
          addressZero, deysi.address, contador
        );
      }
    });
  });
});
