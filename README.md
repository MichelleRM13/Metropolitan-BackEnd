# Metropolitan-SC
Con la intención de ayudar en la automatización de los sistemas actuales se planteo en el siguiente proyecto la generación de un token (MetropolitanToken) que sera usado para los cobros de pasajes en el Metro de Lima y el Metropolitano. Para el manejo de las recargas y cobros se escogio la red Ethereum (Goerli). 

Para la simulación de los soles peruanos se procedio a crear un token que sera intercambiado por MetropolitanTokens en un casa de cambios descentralizada (DEX - UNISWAP).Para ello se creo un pool de liquidez de un par de tokens. Es decir, que en dicho pool se depositen una cierta cantidad de cada token. La cantidad a depositar de cada token determinará el tipo de cambio a usar en los swaps mientras exista el pool de liquidez. Este cambio se realiza de manera programática en un contrato inteligente.

Para incentivar la compra de MetropolitanTokens se realiza un regalo de NFTs que luego de adquiridos podran ser vendidos por MetropolitanTokens. Estos NFTs estan divididos en dos grupos: Del 1 al 100 son considerados NFTS Basicos que seran ofrecidos a aquellos que intercambien mas de 50 soles y del 101 al 118 son considerados NFTS Legendarios que seran ofrecidos a aquellos que intercambien mas de 100 soles.

Para asegurar la conveniencia del usuario se ha creado una arquitectura de contratos y middleware (Open Zeppelin Defender) que consta de las siguientes partes:

1. Token ERC20 (MetropolitanToken)
2. NFT ERC721 (Colección de NFTs de regalo)
3. Contrato de intercambio de PENCoin por MetropolitanToken (Metro Recharge)
4. PENCoin (stable coin - Tiene seis (2) decimales)
5. Open Zeppelin Defender (Middleware)
6. IPFS/Piñata
7. Pool de liquidez (Par: PENCoin y MetropolitanToken - UNISWAP)

**Token ERC20 MetropolitanToken**
Contrato que sigue el estándar ERC20 y tiene el método `mint` protegido. Este token será uno de los usado en la creación del pool de liquidez y para el cobro de pasajes. Tiene dieciocho (18) decimales.

**Contrato PENCoin**
Este contrato sigue el estándar ERC20 y tiene el método `mint` protegido. Este token simula la poseción de soles digitales. Su función es la de proveer fondos para iniciar las operaciones de pago de pasajes. Tiene seis (2) decimales.

**Contrato NFT**
Contrato que sigue el estándar ERC721. La compra de estos NFTs se realiza a través de eventos que se disparan desde el contrato de recarga. Este contrato funciona como un contrato satélite y el usuario final nunca interactúa con este contrato. Todos los métodos de este contrato son protegidos. La única address con el privilegio de poder llamar métodos del contrato NFT es el Relayer de Open Zeppelin.

**Contrato de Cambio de PENCoin por MetropolitanTokens**
Este contrato sirve de interface para realizar la recarga de las billeteras electronicas. El usuario deposita PENCoins y el contrato realiza la conversión segun el pool de liquidez para el deposito de MetropolitanTokens al usuario. La comunicación entre el contrato de Compra y Venta y el contrato de NFTs se dará a través de Open Zeppelin Defender. El contrato de Compra y Venta emite eventos que serán escuchados por Open Zeppelin Defender, que a su vez ordenará al contrato de NFT de acuñar un determinado NFT.