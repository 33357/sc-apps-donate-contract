import '@nomiclabs/hardhat-ethers';
import {task} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import * as utils from '../utils';

const taskSymbol = 'Star';
const taskName = `${taskSymbol}:verify`;

task(taskName, `verify ${taskSymbol}`).setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const deployment = await utils.getDeployment(
      Number(await hre.getChainId())
    );

    utils.log.info(
      `verify ${deployment.Star.contract},implAddress: ${deployment.Star.implAddress}`
    );
    await hre.run('verify:verify', {
      address: deployment.Star.implAddress,
      constructorArguments: [],
    });
  }
);
