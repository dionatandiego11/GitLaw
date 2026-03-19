import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

const b32 = (value) => ethers.encodeBytes32String(value);

describe(
  "GitLaw on-chain core",
  { concurrency: false },
  async function () {
    let owner;
    let ana;
    let bruno;
    let clara;

    let ownerAddress;
    let anaAddress;
    let brunoAddress;
    let claraAddress;

    let citizenship;
    let repository;
    let voting;
    let forks;

    const centro = b32("centro");
    const norte = b32("norte");
    const sul = b32("sul");
    const lawId = b32("lei-zoneamento");

    async function deploySystem() {
      [owner, ana, bruno, clara] = await ethers.getSigners();
      ownerAddress = await owner.getAddress();
      anaAddress = await ana.getAddress();
      brunoAddress = await bruno.getAddress();
      claraAddress = await clara.getAddress();

      citizenship = await ethers.deployContract("CidadaniaToken", [
        "GitLaw Cidadania",
        "GLCIT",
        "https://gitlaw.local/cidadania/",
      ]);
      await citizenship.waitForDeployment();

      repository = await ethers.deployContract("GitLawRepository");
      await repository.waitForDeployment();

      voting = await ethers.deployContract("WeightedVoting", [
        await citizenship.getAddress(),
      ]);
      await voting.waitForDeployment();

      forks = await ethers.deployContract("NeighborhoodForks", [
        await citizenship.getAddress(),
        await voting.getAddress(),
      ]);
      await forks.waitForDeployment();
    }

    beforeEach(async () => {
      await deploySystem();
    });

    it("mints soulbound citizenship tokens and blocks transfers", async function () {
      await citizenship.mintCitizen(anaAddress, centro, 3n);

      const citizen = await citizenship.citizenshipOf(anaAddress);
      assert.equal(citizen.tokenId, 1n);
      assert.equal(citizen.bairroId, centro);
      assert.equal(citizen.nivel, 3n);
      assert.equal(citizen.active, true);
      assert.equal(await citizenship.balanceOf(anaAddress), 1n);

      await assert.rejects(
        citizenship.connect(ana).transferFrom(anaAddress, brunoAddress, 1n),
        /NonTransferable/,
      );

      await citizenship.revokeCitizen(anaAddress);

      const revokedCitizen = await citizenship.citizenshipOf(anaAddress);
      assert.equal(revokedCitizen.active, false);
      assert.equal(await citizenship.balanceOf(anaAddress), 0n);
    });

    it("registers laws and records immutable legislative commits", async function () {
      const commitId = b32("commit-zoneamento-1");
      const proposalId = b32("pr-zoneamento-1");

      await repository.registerLaw(
        lawId,
        "LC-2026-001",
        "Lei de Zoneamento",
        "urbanismo",
        "1.0.0",
        "ipfs://lei-zoneamento-v1",
        ethers.ZeroHash,
        ethers.ZeroHash,
        false,
      );

      await repository.recordCommit(
        commitId,
        lawId,
        proposalId,
        "1.0.1",
        "Ajusta gabarito e recuos",
        "ipfs://lei-zoneamento-v2",
        ownerAddress,
      );

      const law = await repository.getLaw(lawId);
      const commit = await repository.getCommit(commitId);
      const commitIds = await repository.getCommitIdsByLaw(lawId);

      assert.equal(law.titulo, "Lei de Zoneamento");
      assert.equal(law.versaoAtual, "1.0.1");
      assert.equal(law.contentHash, "ipfs://lei-zoneamento-v2");
      assert.equal(commit.lawId, lawId);
      assert.equal(commit.proposalId, proposalId);
      assert.equal(commit.message, "Ajusta gabarito e recuos");
      assert.deepEqual([...commitIds], [commitId]);
    });

    it("applies weighted neighborhood voting and only allows forks after approval", async function () {
      const proposalId = b32("pr-fork-centro");
      const forkId = b32("fork-centro");
      const forkLawId = b32("lei-zoneamento-centro");

      await citizenship.mintCitizen(anaAddress, centro, 5n);
      await citizenship.mintCitizen(brunoAddress, norte, 4n);
      await citizenship.mintCitizen(claraAddress, sul, 2n);

      const latestBlock = await ethers.provider.getBlock("latest");
      const votingEndsAt = BigInt(latestBlock.timestamp + 3600);

      await voting.connect(ana).createProposal(
        proposalId,
        lawId,
        centro,
        [centro],
        [norte],
        votingEndsAt,
        150n,
        1,
      );

      assert.equal(await voting.voteWeightFor(proposalId, anaAddress), 100n);
      assert.equal(await voting.voteWeightFor(proposalId, brunoAddress), 60n);
      assert.equal(await voting.voteWeightFor(proposalId, claraAddress), 30n);

      await voting.connect(ana).castVote(proposalId, 1);
      await voting.connect(bruno).castVote(proposalId, 1);
      await voting.connect(clara).castVote(proposalId, 2);

      assert.equal(await voting.canCreateFork(proposalId, centro), false);
      await assert.rejects(
        forks.connect(ana).createFork(
          forkId,
          proposalId,
          centro,
          forkLawId,
          "centro-zoneamento",
          "ipfs://fork-centro-objetivo",
        ),
        /ProposalNotApprovedForFork/,
      );

      await networkHelpers.time.increaseTo(votingEndsAt + 1n);
      await voting.finalizeProposal(proposalId);

      const proposal = await voting.getProposal(proposalId);
      assert.equal(proposal.favor, 160n);
      assert.equal(proposal.contra, 30n);
      assert.equal(proposal.abster, 0n);
      assert.equal(proposal.finalized, true);
      assert.equal(proposal.approved, true);
      assert.equal(await voting.canCreateFork(proposalId, centro), true);

      await forks.connect(ana).createFork(
        forkId,
        proposalId,
        centro,
        forkLawId,
        "centro-zoneamento",
        "ipfs://fork-centro-objetivo",
      );

      const fork = await forks.getFork(forkId);
      assert.equal(fork.proposalId, proposalId);
      assert.equal(fork.lawId, lawId);
      assert.equal(fork.forkLawId, forkLawId);
      assert.equal(fork.neighborhoodId, centro);
      assert.equal(fork.slug, "centro-zoneamento");
      assert.equal(fork.author, anaAddress);
      assert.equal(fork.active, true);
    });
  },
);
