import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { PayableOverrides } from 'ethers';
import {
  EthersExecutionManager,
  getDeployment,
  setDeployment,
  LOCK_DIR,
  RETRY_NUMBER,
  log,
} from '../utils';

const starContract = 'Star';
const taskSymbol = 'Star';
const taskName = `${taskSymbol}:deploy`;

task(taskName, `Deploy ${taskSymbol}`)
  .addOptionalParam('waitNum', 'The waitNum to transaction')
  .addOptionalParam('gasPrice', 'The gasPrice to transaction')
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    const txConfig: PayableOverrides = {};
    txConfig.gasPrice = args['gasPrice']
      ? hre.ethers.utils.parseUnits(args['gasPrice'], 'gwei')
      : undefined;
    const waitNum = args['waitNum'] ? parseInt(args['waitNum']) : 1;
    const ethersExecutionManager = new EthersExecutionManager(
      `${LOCK_DIR}/${taskName}.lock`,
      RETRY_NUMBER,
      waitNum
    );
    await ethersExecutionManager.load();
    const operator = (await hre.ethers.getSigners())[0];
    const chainId = Number(await hre.getChainId());

    log.info(`deploy ${starContract}`);
    const Star = await hre.ethers.getContractFactory(starContract);
    const deployWethResult = await ethersExecutionManager.transaction(
      Star.deploy.bind(Star),
      [],
      ['contractAddress', 'blockNumber'],
      `deploy ${starContract}`,
      txConfig
    );
    const starProxyAddress = deployWethResult.contractAddress;
    const starImplAddress = starProxyAddress;
    const starFromBlock = deployWethResult.blockNumber;
    const starVersion = '1.0.0';
    log.info(
      `${starContract} deployed proxy at ${starProxyAddress},impl at ${starImplAddress},version ${starVersion},fromBlock ${starFromBlock}`
    );

    const deployment = await getDeployment(chainId);

    deployment.Star = {
      proxyAddress: starProxyAddress,
      implAddress: starImplAddress,
      version: starVersion,
      contract: starContract,
      operator: operator.address,
      fromBlock: starFromBlock,
    };

    await setDeployment(chainId, deployment);

    ethersExecutionManager.printGas();
    ethersExecutionManager.deleteLock();
  });
