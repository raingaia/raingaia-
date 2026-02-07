# contract-sol/compile_contract.py
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from solcx import compile_standard, install_solc, set_solc_version


ROOT = Path(__file__).resolve().parent
DEFAULT_CONTRACT_FILE = ROOT / "DigitalSeal.sol"
BUILD_DIR = ROOT / "build"
DEFAULT_SOLC_VERSION = os.getenv("SOLC_VERSION", "0.8.20")  # pin a modern 0.8.x


def log(msg: str) -> None:
    # ASCII-only logs (no Turkish chars)
    print(msg.encode("ascii", "ignore").decode("ascii"))


def fail(msg: str, code: int = 1) -> None:
    log(f"[ERROR] {msg}")
    raise SystemExit(code)


def ensure_solc(version: str) -> None:
    # Install only if missing; then pin active version
    try:
        install_solc(version)
    except Exception:
        # If already installed, install_solc may still be fine; ignore hard failures only if version exists
        pass

    try:
        set_solc_version(version)
    except Exception as e:
        fail(f"Could not set solc version={version}. Details: {e}")


def compile_contract(contract_path: Path, solc_version: str) -> dict:
    if not contract_path.exists():
        fail(f"Contract file not found: {contract_path}")

    source = contract_path.read_text(encoding="utf-8", errors="replace")

    input_json = {
        "language": "Solidity",
        "sources": {contract_path.name: {"content": source}},
        "settings": {
            "optimizer": {"enabled": True, "runs": 200},
            "outputSelection": {
                "*": {
                    "*": [
                        "abi",
                        "evm.bytecode.object",
                        "evm.deployedBytecode.object",
                        "metadata",
                    ]
                }
            },
        },
    }

    ensure_solc(solc_version)

    try:
        out = compile_standard(input_json, allow_paths=str(ROOT))
    except Exception as e:
        fail(f"Solidity compilation failed. Details: {e}")

    # Surface compiler errors/warnings cleanly
    errors = out.get("errors", [])
    hard_errors = [er for er in errors if er.get("severity") == "error"]
    if hard_errors:
        for er in hard_errors[:10]:
            log(f"[SOLC_ERROR] {er.get('formattedMessage','(no message)')}")
        fail("Compilation produced errors.")

    # Warnings are fine; print a few
    warns = [er for er in errors if er.get("severity") == "warning"]
    for er in warns[:5]:
        log(f"[SOLC_WARN] {er.get('formattedMessage','(no message)')}")

    return out


def pick_first_contract(compiled: dict, source_name: str) -> tuple[str, dict]:
    contracts = compiled.get("contracts", {}).get(source_name, {})
    if not contracts:
        fail(f"No contracts found in compilation output for source: {source_name}")

    # Prefer DigitalSeal if exists, otherwise first
    if "DigitalSeal" in contracts:
        name = "DigitalSeal"
    else:
        name = sorted(contracts.keys())[0]

    return name, contracts[name]


def write_outputs(contract_name: str, artifact: dict, solc_version: str) -> dict:
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    abi = artifact.get("abi")
    bytecode = artifact.get("evm", {}).get("bytecode", {}).get("object")
    deployed = artifact.get("evm", {}).get("deployedBytecode", {}).get("object")
    metadata = artifact.get("metadata")

    if not abi or bytecode is None:
        fail("Missing ABI or Bytecode in compiler output.")

    # Write separate files (easy for Next / python / cpp to read)
    (BUILD_DIR / f"{contract_name}.abi.json").write_text(
        json.dumps(abi, indent=2), encoding="utf-8"
    )
    (BUILD_DIR / f"{contract_name}.bin").write_text(bytecode, encoding="utf-8")
    (BUILD_DIR / f"{contract_name}.deployed.bin").write_text(deployed or "", encoding="utf-8")
    (BUILD_DIR / f"{contract_name}.metadata.json").write_text(
        metadata or "{}", encoding="utf-8"
    )

    # A single “artifact” file (handy for Next)
    manifest = {
        "contract": contract_name,
        "solc_version": solc_version,
        "paths": {
            "abi": str((BUILD_DIR / f"{contract_name}.abi.json").as_posix()),
            "bin": str((BUILD_DIR / f"{contract_name}.bin").as_posix()),
            "deployed_bin": str((BUILD_DIR / f"{contract_name}.deployed.bin").as_posix()),
            "metadata": str((BUILD_DIR / f"{contract_name}.metadata.json").as_posix()),
        },
    }
    (BUILD_DIR / f"{contract_name}.manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )

    return manifest


def main() -> None:
    contract_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_CONTRACT_FILE
    solc_version = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_SOLC_VERSION

    log("[INFO] Nexus compile_contract starting...")
    log(f"[INFO] Contract file: {contract_path}")
    log(f"[INFO] solc version: {solc_version}")

    compiled = compile_contract(contract_path, solc_version)

    source_name = contract_path.name
    contract_name, artifact = pick_first_contract(compiled, source_name)

    manifest = write_outputs(contract_name, artifact, solc_version)

    log("[OK] Compilation complete.")
    log(f"[OK] Contract: {contract_name}")
    log(f"[OK] Outputs: {manifest['paths']}")
    # Print machine-readable manifest last line (Next can parse)
    print(json.dumps(manifest))


if __name__ == "__main__":
    main()
