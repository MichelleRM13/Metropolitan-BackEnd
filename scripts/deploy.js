require("dotenv").config();

const { getRole, verify, ex, printAddress, deploySC, deploySCNoUp } = require("../utils");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

var tokenPenAdd = "0x020bCBEEB5CB98491911F3543880CBfa69Aea204";
var tokenMtpAdd = "0x51251833b4439D66B86AEE970dF6e3941479EEc0";
var uniswapAdd = "0xCe8B13F5bf0cE9B1f2A53e39bFa2533279B65B25";
var defiAdd = "0x2E0a626679B5a50FD744F3Cd2e9e1773aCE0cf71";
var rechargeAdd = "0x90E124751a7E1f3230F64bC19A95446d3828aF5E";

var gcf = hre.ethers.getContractFactory;
var pEth = hre.ethers.utils.parseEther;
var fEth = hre.ethers.utils.formatEther;

var decimalsPEN = 10 ** 2;

//utils...
async function execute(signer, smartContract, command, args, msg) {
  var txHash;
  try {
    var tx = await smartContract.connect(signer)[command](...args);
    var res = await tx.wait();

    txHash = getTxHash(res.transactionHash);
  } catch (error) {
    console.log(`Failed SC ${msg}: ${error}`);
  }

  return [txHash, res];
}

///-----------------------------------------------------------------------------------------------
// https://goerli.etherscan.io/address/0x020bCBEEB5CB98491911F3543880CBfa69Aea204                 |
// add proxy: 0x020bCBEEB5CB98491911F3543880CBfa69Aea204                                          |
// add impl: 0x020bCBEEB5CB98491911F3543880CBfa69Aea204                                           |
///-----------------------------------------------------------------------------------------------
async function deployPEN() {
  var name = "PENCoin";
  var pencContract = await deploySC(name, []);
  var implementation = await printAddress("PENC SC", pencContract.address)
  await verify(implementation, name, []);
}

///-----------------------------------------------------------------------------------------------
// https://goerli.etherscan.io/address/0x51251833b4439D66B86AEE970dF6e3941479EEc0              |
// add proxy: 0x51251833b4439D66B86AEE970dF6e3941479EEc0                                          |
// add impl: 0xEdDf3D327ec37A7C4D895c9d3DBc29B05040B33B                                           |
///-----------------------------------------------------------------------------------------------
async function deployMTPTK() {
  var name = "MetropolitanToken";
  var mtptkContract = await deploySC(name, []);
  var implementation = await printAddress("MTPTK SC", mtptkContract.address)
  await verify(implementation, name, []);
}
///-----------------------------------------------------------------------------------------------
// https://goerli.etherscan.io/address/0x62db3cE50B16E029aB364aa5E37463EBe5ac309E                 |
// add proxy: 0x62db3cE50B16E029aB364aa5E37463EBe5ac309E                                          |
// add impl: 0xcC3D5f7A1145b5dCF849A4734d655bC4D0074aD7                                           |
///-----------------------------------------------------------------------------------------------
async function deployNFT() {
  var relayerAddress = "0x603269ad355c77af99242df02bca15863fb00d66";
  
  var name = "MetropolitanNFT";
  var symbol = "MTPNFT";

  var nftContract = await deploySC("MetropolitanNFT", [name, symbol]);
  var implementation = await printAddress("MTPNFT", nftContract.address);

  // set up
  await ex(nftContract, "grantRole", [MINTER_ROLE, relayerAddress], "GRM");
  await ex(nftContract, "grantRole", [BURNER_ROLE, relayerAddress], "GRB");
  await verify(implementation, "MetropolitanNFT", []);
}

///-----------------------------------------------------------------------------------------------
// https://goerli.etherscan.io/address/0x2E0a626679B5a50FD744F3Cd2e9e1773aCE0cf71                 |
// add proxy: 0x2E0a626679B5a50FD744F3Cd2e9e1773aCE0cf71                                          |
// add impl: 0xcBCc41b2ee19Edf9D3412Cee24CD1b46A5d22c3b                                           |
///-----------------------------------------------------------------------------------------------
async function deploySwap() {
  var Swapper = await gcf("MetropolitanSwap");
  var swapper = await hre.upgrades.deployProxy(Swapper, [tokenPenAdd, tokenMtpAdd], {
    kind: "uups",
  });
  var tx = await swapper.deployed();
  await tx.deployTransaction.wait(5);

  console.log("Swap Address P: ", swapper.address);
  var implementation = await upgrades.erc1967.getImplementationAddress(
    swapper.address
  );
  console.log("Swap Address I: ", implementation);

  await hre.run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });
}

///-----------------------------------------------------------------------------------------------
// https://goerli.etherscan.io/address/0x90E124751a7E1f3230F64bC19A95446d3828aF5E                 |
// add proxy: 0x90E124751a7E1f3230F64bC19A95446d3828aF5E                                          |
// add impl: 0x47b56B2B28360Be3B9c91b79E47090A0d6dB879B                                           |                                        |
///-----------------------------------------------------------------------------------------------
async function deployMetroRecharge() {
  var Recharge = await gcf("MetroRecharge");
  var recharge = await hre.upgrades.deployProxy(Recharge, [tokenPenAdd, defiAdd], {
    kind: "uups",
  });
  var tx = await recharge.deployed();
  await tx.deployTransaction.wait(5);

  console.log("MetroRecharge Address P: ", recharge.address);
  var implementation = await upgrades.erc1967.getImplementationAddress(
    recharge.address
  );
  console.log("MetroRecharge Address I: ", implementation);

  await hre.run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });
}

//Inicializa contratos y devuelve tokens...
async function initSCs() {
  console.log("initSCs ini.......");
  var [owner, alice] = await hre.ethers.getSigners();
  var TokenA = await gcf("PENCoin");
  var tokenA = TokenA.attach(tokenPenAdd);
  console.log("PENCoin add: " + tokenA.address);

  var TokenB = await gcf("MetropolitanToken");
  var tokenB = TokenB.attach(tokenMtpAdd);
  console.log("MetropolitanToken add: " + tokenB.address);

  var DeFi = await gcf("MetropolitanSwap");
  var deFi = DeFi.attach(defiAdd);
  console.log("MetropolitanSwap add: " + deFi.address);

  var Recharge = await gcf("MetroRecharge");
  var recharge = Recharge.attach(rechargeAdd);
  console.log("MetroRecharge add: " + recharge.address);

  console.log("Owner add: " + owner.address)

  return [tokenA, tokenB, deFi, recharge, owner, alice];
}

async function addLiquidity() {
  var [tokenPen, tokenMtp, deFi] = await initSCs();

  // Depositar tokens en el contrato que creará el pool de liquidez(DEFI)
  var tx = await tokenPen.mint(deFi.address, 90000 * 10 ** 2);
  await tx.wait();
  var tx = await tokenMtp.mint(deFi.address, pEth("9000000"));
  await tx.wait();

  // Definir un ratio
  // 1 PEN = 100 MetropolitanToken

  // Añadir liquidez
  var _amountADesired = 10000;
  var _amountBDesired = 1000000;
  console.log("Ini add liquidity...")
  var tx = await deFi.addLiquidity(
    _amountADesired,
    _amountBDesired
  );
  console.log("Res...");
  var res = await tx.wait();
  console.log("Transaction addLiquidity Hash", res.transactionHash);
}

async function swapExactTokens() {
  var [tokenA, tokenB, deFi, recharge, owner] = await initSCs();
  console.log("uniswap...")
  console.log("PEN ini: " + (await tokenA.balanceOf(uniswapAdd)).toString())
  console.log("MTPTK ini: " + (await tokenB.balanceOf(uniswapAdd)).toString())
  console.log("defi...")
  console.log("PEN ini: ", (await tokenA.balanceOf(deFi.address)).toString());
  console.log("MTPTK ini: ", (await tokenB.balanceOf(deFi.address)).toString());
  console.log("Owner...")
  console.log("PEN ini: ", (await tokenA.balanceOf(owner.address)).toString());
  console.log("MTPTK ini: ", (await tokenB.balanceOf(owner.address)).toString());

  var amountIn = 10*decimalsPEN; // Envio exactamente 10 PEN por "x" MetropolitanToken
  console.log("Cantidad a enviar: " + amountIn)
  console.log("Envio " + amountIn + " PEN al contrato swap...")
  var tx = await tokenA.transfer(deFi.address, amountIn);
  var res = await tx.wait();
  console.log("Transaction Hash", res.transactionHash);

  tx = await deFi.swapExactTokensForTokens(amountIn);
  res = await tx.wait();
  console.log("Transaction Hash Swap", res.transactionHash);

  console.log("uniswap...")
  console.log("PEN fin: " + (await tokenA.balanceOf(uniswapAdd)).toString())
  console.log("MTPTK fin: " + (await tokenB.balanceOf(uniswapAdd)).toString())
  console.log("defi...")
  console.log("PEN fin: ", (await tokenA.balanceOf(deFi.address)).toString());
  console.log("MTPTK fin: ", (await tokenB.balanceOf(deFi.address)).toString());
  console.log("Owner...")
  console.log("PEN fin: ", (await tokenA.balanceOf(owner.address)).toString());
  console.log("MTPTK fin: ", (await tokenB.balanceOf(owner.address)).toString());
}

async function comprarMPTKporPEN() {
  //Depositar la siguiente cantidad de SOLES (PEN)
  var _cantidadPEN = 50;
  var [tokenA, tokenB, deFi, recharge, owner] = await initSCs();
  console.log("uniswap...")
  console.log("PEN ini: " + (await tokenA.balanceOf(uniswapAdd)).toString())
  console.log("MTPTK ini: " + (await tokenB.balanceOf(uniswapAdd)).toString())
  console.log("Swapper...")
  console.log("PEN ini: ", (await tokenA.balanceOf(deFi.address)).toString());
  console.log("MTPTK ini: ", (await tokenB.balanceOf(deFi.address)).toString());
  console.log("Recharge...")
  console.log("PEN ini: ", (await tokenA.balanceOf(recharge.address)).toString());
  console.log("MTPTK ini: ", (await tokenB.balanceOf(recharge.address)).toString());
  console.log("Owner...")
  console.log("PEN ini: ", (await tokenA.balanceOf(owner.address)).toString());
  console.log("MTPTK ini: ", (await tokenB.balanceOf(owner.address)).toString());

  var _amountPen = _cantidadPEN*decimalsPEN; 
  console.log("Cantidad a enviar: " + _amountPen);
  console.log("Cambio de PEN - MTPTK...");
  tx = await recharge.comprarMtptkPorPEN(_amountPen);
  res = await tx.wait();
  console.log("Transaction Hash Swap", res.transactionHash);
  console.log("Envio " + _cantidadPEN + " PEN al contrato swap...");
  var tx = await tokenA.transfer(deFi.address, _amountPen);
  var res = await tx.wait();
  console.log("Transaction Hash", res.transactionHash);

  console.log("uniswap...")
  console.log("PEN fin: " + (await tokenA.balanceOf(uniswapAdd)).toString())
  console.log("MTPTK fin: " + (await tokenB.balanceOf(uniswapAdd)).toString())
  console.log("Swapper...")
  console.log("PEN fin: ", (await tokenA.balanceOf(deFi.address)).toString());
  console.log("MTPTK fin: ", (await tokenB.balanceOf(deFi.address)).toString());
  console.log("Recharge...")
  console.log("PEN fin: ", (await tokenA.balanceOf(recharge.address)).toString());
  console.log("MTPTK fin: ", (await tokenB.balanceOf(recharge.address)).toString());
  console.log("Owner...")
  console.log("PEN fin: ", (await tokenA.balanceOf(owner.address)).toString());
  console.log("MTPTK fin: ", (await tokenB.balanceOf(owner.address)).toString());
}

// deployPEN()
// deployMTPTK()
// deployNFT()
// deploySwap()
// addLiquidity()
// deployMetroRecharge()
comprarMPTKporPEN()
  .catch((error) => {
    console.error("-------ERROR-------->>")
    console.error(error);
    process.exitCode = 1;
  });
