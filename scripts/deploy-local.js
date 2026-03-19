import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dataDir = process.env.GITLAW_DATA_DIR
  ? path.resolve(projectRoot, process.env.GITLAW_DATA_DIR)
  : path.join(projectRoot, "data");

async function writeJson(relativePath, value) {
  const targetPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(projectRoot, relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const { ethers } = await network.connect();
const [deployer] = await ethers.getSigners();

const citizenship = await ethers.deployContract("CidadaniaToken", [
  "GitLaw Cidadania",
  "GLCIT",
  "https://gitlaw.local/cidadania/",
]);
await citizenship.waitForDeployment();

const repository = await ethers.deployContract("GitLawRepository");
await repository.waitForDeployment();

const voting = await ethers.deployContract("WeightedVoting", [await citizenship.getAddress()]);
await voting.waitForDeployment();

const forks = await ethers.deployContract("NeighborhoodForks", [
  await citizenship.getAddress(),
  await voting.getAddress(),
]);
await forks.waitForDeployment();

const chain = await ethers.provider.getNetwork();
const blockNumber = await ethers.provider.getBlockNumber();

const deploymentSnapshot = {
  name: "gitlaw-local-chain",
  network: process.env.HARDHAT_NETWORK ?? "localhost",
  chainId: Number(chain.chainId),
  blockNumber,
  deployedAt: new Date().toISOString(),
  deployer: await deployer.getAddress(),
  contracts: {
    cidadaniaToken: await citizenship.getAddress(),
    gitLawRepository: await repository.getAddress(),
    weightedVoting: await voting.getAddress(),
    neighborhoodForks: await forks.getAddress(),
  },
};

await writeJson(path.join(dataDir, "chain.deployment.json"), deploymentSnapshot);

console.log(JSON.stringify(deploymentSnapshot, null, 2));
