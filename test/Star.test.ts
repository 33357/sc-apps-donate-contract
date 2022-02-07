import { expect } from 'chai';
import { ethers, getNamedAccounts} from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import pino from 'pino';
import { Star, ERC20TEST } from '../typechain';

const Logger = pino();

describe('test Star', function () {
  let deployer: Signer;
  let accountA: Signer;

  before('setup accounts', async () => {
    const NamedAccounts = await getNamedAccounts();
    deployer = await ethers.getSigner(NamedAccounts.deployer);
    accountA = await ethers.getSigner(NamedAccounts.accountA);
  });

  describe('test Star contract', function () {
    let star: Star;
    let erc20: ERC20TEST;

    beforeEach('deploy and init contract', async () => {
      const Star = await ethers.getContractFactory('Star');
      star = (await Star.connect(deployer).deploy()) as Star;
      Logger.info(`deployed Star contract`);

      const ERC20 = await ethers.getContractFactory('ERC20_TEST');
      erc20 = (await ERC20.connect(deployer).deploy()) as ERC20TEST;
      Logger.info(`deployed ERC20 contract`);
    });

    it('check init data', async function () {
      expect(await star.maxDonate()).eq(BigNumber.from((10 ** 18).toString()));
      expect(await star.minDonate()).eq((10 ** 16).toString());
      expect(await star.name()).eq("SC_APPS_STAR");
      expect(await star.symbol()).eq("Star");
      expect(await star.reward()).eq(1000000);
      expect(await star.rewardBase()).eq(10000);
    });

    it('check donate', async function () {
      let value = BigNumber.from((10 ** 18).toString());
      let answer = value.mul(await star.reward()).div(await star.rewardBase());
      await star.donate(answer,{value});
      expect(await star.reward()).eq(BigNumber.from(1000000).mul(996).div(1000))

      value = BigNumber.from((10 ** 18).toString()).add(1);
      answer = value.mul(await star.reward()).div(await star.rewardBase());
      await expect(star.donate(answer,{value})).revertedWith(
        'Star: error value'
      );

      value = BigNumber.from((10 ** 16).toString()).sub(1);
      answer = value.mul(await star.reward()).div(await star.rewardBase());
      await expect(star.donate(answer,{value})).revertedWith(
        'Star: error value'
      );

      value = BigNumber.from((10 ** 18).toString());
      answer = value;
      await expect(star.donate(answer,{value})).revertedWith(
        'Star: error answer'
      );
    });

    it('check owner', async function () {
      await expect(star.connect(accountA).get(await accountA.getAddress())).revertedWith(
        'Ownable: caller is not the owner'
      );

      await star.connect(deployer).get(await deployer.getAddress());

      await expect(star.connect(deployer).get(star.address)).revertedWith(
        'Star: error receiver'
      );

      await erc20.transfer(star.address, BigNumber.from(100));
      await expect(
        star
          .connect(accountA)
          .transferAnyERC20Token(
            erc20.address,
            await accountA.getAddress(),
            BigNumber.from(100)
          )
      ).revertedWith('Ownable: caller is not the owner');
      await star
        .connect(deployer)
        .transferAnyERC20Token(
          erc20.address,
          await accountA.getAddress(),
          BigNumber.from(100)
        );
      expect(await erc20.balanceOf(await accountA.getAddress())).equal(
        BigNumber.from(100)
      );
    });
  });
});
