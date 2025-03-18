# Some examples of using algosdk from Python, JavaScript and TypeScript

Note: 

The Python Algorand SDK source is at https://github.com/algorand/py-algorand-sdk

The JavaScript/TypeScript Algorand SDK source is at https://github.com/algorand/js-algorand-sdk  

This repo is named as akt02, AlgoKit Trial, 2nd try

Log in to github.com
Clone this repository
Press "Code" button, select "Codespaces" tab, "Create codespace on main" or "Start" if already created a codespace

In the codespaces window, press ≡, "Terminal" | "New Terminal"

Initial steps
```
# Check if AlgoKit is installed
@A-Maugli ➜ /workspaces/akt02 (main) $ algokit --version
algokit, version 2.5.2

# If AlgoKit is not installed: install AlgoKit
@A-Maugli ➜ /workspaces/akt02 (main) $ python3 -m pip install --user pipx
@A-Maugli ➜ /workspaces/akt02 (main) $ pipx install algokit

# Start localnet
@A-Maugli ➜ /workspaces/akt02 (main) $ algokit localnet start
Starting AlgoKit LocalNet now...
docker: Container algokit_sandbox_postgres  Created
docker: Container algokit_sandbox_algod  Created
...
docker: Container algokit_sandbox_indexer  Healthy
docker: Container algokit_sandbox_conduit  Healthy
Started; execute `algokit explore` to explore LocalNet in a web user interface.
@A-Maugli ➜ /workspaces/akt02 (main) $ 

# Check localnet status
@A-Maugli ➜ /workspaces/akt02 (main) $ algokit localnet status
# container engine
Name: docker (change with `algokit config container-engine`)
# algod status
Status: Running
Port: 4001
Last round: 0
Time since last round: 0.0s
Genesis ID: dockernet-v1
Genesis hash: rg6YKoMx276bv3m8uwbUuhaOhduI0wMM0yj2v7fehkw=
Version: 4.0.2
# conduit status
Status: Running
# indexer-db status
Status: Running
# indexer status
Status: Running
Port: 8980
Last round: 0
Version: 3.7.2
# proxy status
Status: Running

# Alternative way to check localnet status
@A-Maugli ➜ /workspaces/akt02 (main) $ docker container ls
CONTAINER ID   IMAGE                     COMMAND                  CREATED          STATUS          PORTS                                                                                                                    NAMES
d26385cabdb8   nginx:1.27.0-alpine       "/docker-entrypoint.…"   20 minutes ago   Up 3 minutes    0.0.0.0:4001-4002->4001-4002/tcp, :::4001-4002->4001-4002/tcp, 80/tcp, 0.0.0.0:8980->8980/tcp, :::8980->8980/tcp         algokit_sandbox_proxy
943fcbf608da   algorand/indexer:latest   "docker-entrypoint.s…"   20 minutes ago   Up 3 minutes                                                                                                                             algokit_sandbox_indexer
eaabbf51fa1a   algorand/conduit:latest   "docker-entrypoint.sh"   20 minutes ago   Up 13 seconds                                                                                                                            algokit_sandbox_conduit
cae53f67fcae   postgres:16-alpine        "docker-entrypoint.s…"   20 minutes ago   Up 3 minutes    0.0.0.0:5443->5432/tcp, [::]:5443->5432/tcp                                                                              algokit_sandbox_postgres
3fab9a22f478   algorand/algod:latest     "/node/run/run.sh"       20 minutes ago   Up 3 minutes    4160/tcp, 8080/tcp, 9100/tcp, 0.0.0.0:9392->9392/tcp, :::9392->9392/tcp, 0.0.0.0:32769->7833/tcp, [::]:32769->7833/tcp   algokit_sandbox_algod

# Go to "Ports" tab,  in the "algod" line click on the lock icon with the right mouse button, Select "Port visibility" | "Public"
# Do similarly with kmd (4002) port and indexer (8980) port 

# Start blockchain explorer
@A-Maugli ➜ /workspaces/akt02 (main) $ algokit explore
Opening localnet explorer in your default browser

Do you want Code to open the external website?
Press "Open"

# Was already done, DO NOT do it again: initialize AlgoKit project
@A-Maugli ➜ /workspaces/akt02 (main) $ algokit init
algokit init
? Select a project template:  playground
     Official template showcasing a number of small example applications and demos.
? Name of project / directory to create the project in:  hellow
Starting template copy and render...
Template render complete!
? Do you want to run `algokit bootstrap` for this new project? This will install and configure dependencies allowing it to be run immediately. Yes
Poetry not found; attempting to install it...
? We couldn't find `poetry`; can we install it for you via pipx so we can install Python dependencies? Yes
Installing Python dependencies and setting up Python virtual environment via Poetry
...
```

In order to run the Pyton examples, using py-algorand-sdk 2.5.0:
```
# Initialize Python virtual environment
@A-Maugli ➜ /workspaces/akt02 (main) $ source ./hellow/.venv/bin/activate

# Go to the python_api directory
(playground-py3.12) @A-Maugli ➜ /workspaces/akt02 (main) $ cd hellow/playground/python_api/

# Run the examples, e.g.
(playground-py3.12) @A-Maugli ➜ /workspaces/akt02/hellow/playground/python_api (main) $ python 01_account-generation.py 
My address: SLMUFFYSZGVKVD23ESX4G5MAXROMKLSH3GDEOGJHADER3FWY7ZACYZ2IHA
My private key: lxwXp+iNEjsdPCKaZlj1BHxoa25Bf3yZ1ekFz6Fz26yS2UKXEsmqqo9bJK/DdYC8XMUuR9mGRxknAMkdltj+QA==
My passphrase: napkin fragile fatal teach celery excite thought captain spy ghost kingdom scare special onion arena leg convince filter visual utility drum table grocery absent mother

# At the end, deactivate the virtual Python environment
(playground-py3.12) @A-Maugli ➜ .../akt02/hellow/playground/python_api (main) $ deactivate
@A-Maugli ➜ .../akt02/hellow/playground/python_api (main) $ 
```

In order to run the JavaScript examples, using algosdk 2.7.0:
```
# Go to the js_api directory
@A-Maugli ➜ /workspaces/akt02 (main) $ cd hellow/playground/js_api/

# Install node_modules
@A-Maugli ➜ .../akt02/hellow/playground/js_api (main) $ npm install

up to date, audited 14 packages in 670ms

3 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

# Run the examples, e.g.
@A-Maugli ➜ /workspaces/akt02/hellow/playground/js_api (main) $ node 01-account_generation.js 
Account address: UWGHPYNAIDYGVUSGCHPNBRBU2I2D6IZGNCLQ2IRMYKX2KJUSD4YXF4E22Q
Private key: nCM+WEuDmrunF70HRqDIXln6UUHHxGv11EsfQQeFd3yljHfhoEDwatJGEd7QxDTSND8jJmiXDSIswq+lJpIfMQ==
Account mnemonic: inform weasel project cruise crush upon rule rug science library gold nominee visa federal deliver shadow pulp fatigue planet ball attend throw together about employ
gitpod /workspace/akt02/hellow/playground/js_api (main) $
```

In order to run the TypeScript examples, using algosdk 3.2.0:
```
# Go to the ts_api directory
@A-Maugli ➜ /workspaces/akt02 (main) $ cd hellow/playground/ts_api/

# Install node modules
@A-Maugli ➜ .../akt02/hellow/playground/ts_api (main) $ algokit project bootstrap all
Installing npm dependencies
npm: 
npm: up to date, audited 14 packages in 594ms
npm: 
npm: found 0 vulnerabilities
Finished bootstrapping /workspaces/akt02/hellow/playground/ts_api

# Transpile .ts files, result in dist
@A-Maugli ➜ .../akt02/hellow/playground/ts_api (main) $ npx tsc

# Run the examples, e..g.
@A-Maugli ➜ .../akt02/hellow/playground/ts_api (main) $ node ./dist/01-account_generation.js 
Account address as 58 char string: AGEY3IACP62GQ4PJGVWIZDPMM4GCYHDSFWTCS5MCLJ5MEPUZECIF4AGNZ4
Account address as Uint8Array:  Uint8Array(32) [
    1, 137, 141, 160,   2, 127, 180, 104,
  113, 233,  53, 108, 140, 141, 236, 103,
   12,  44,  28, 114,  45, 166,  41, 117,
  130,  90, 122, 194,  62, 153,  32, 144
]
Account private key as base64 string: XrBdQwQNVEmin5Ce86IkCmNiGEqy9DpNB2StOGhEjqYBiY2gAn+0aHHpNWyMjexnDCwcci2mKXWCWnrCPpkgkA==
Account private key as mnemonic: armed item canvas space pool myself wonder mountain inherit mesh banner cost shadow maid myself visa point brush rare member spare much crucial absent strike
Account private key as Uint8Array:  Uint8Array(32) [
   94, 176,  93,  67,   4,  13,  84,  73,
  162, 159, 144, 158, 243, 162,  36,  10,
   99,  98,  24,  74, 178, 244,  58,  77,
    7, 100, 173,  56, 104,  68, 142, 166
]
