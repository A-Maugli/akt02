# Néhány példa az Algorand Python SDK és JS SDK használatára

A https://github.com/a-maugli account alatt létrehoztam az akt02 repository-t.

Elindítottam a gitpot-ot oly módon, hogy odamásoltam a `gitpod.io` után a repository URL-jét:
```
https://gitpod.io/#https://github.com/a-maugli/akt02
```

A gitpod-ban történt előkészítés a következő volt:
```
# AlgoKit installálás
gitpod /workspace/akt02 (main) $ python3 -m pip install --user pipx
gitpod /workspace/akt02 (main) $ pipx install algokit
# AlgoKit installálás ellenőrzése
gitpod /workspace/akt02 (main) $ algokit --version
algokit, version 1.11.4
# AlgoKit localnet indítás
gitpod /workspace/akt02 (main) $ algokit localnet start
Starting AlgoKit LocalNet now...
docker: indexer Pulling
docker: conduit Pulling
docker: algod Pulling
...
# Ellenőrzés, hogy a localnet indítása sikerült-e
gitpod /workspace/akt02 (main) $ docker container ls
CONTAINER ID   IMAGE                     COMMAND                  CREATED          STATUS          PORTS                                                                                                                                                 NAMES
2ec38f267de4   algorand/indexer:latest   "docker-entrypoint.s…"   16 minutes ago   Up 16 minutes   0.0.0.0:8980->8980/tcp, :::8980->8980/tcp                                                                                                             algokit_sandbox_indexer
2b2389414e5b   algorand/conduit:latest   "docker-entrypoint.sh"   16 minutes ago   Up 48 seconds                                                                                                                                                         algokit_sandbox_conduit
10e1f592a387   postgres:13-alpine        "docker-entrypoint.s…"   16 minutes ago   Up 16 minutes   0.0.0.0:5443->5432/tcp, :::5443->5432/tcp                                                                                                             algokit_sandbox_postgres
395abcae3815   algorand/algod:latest     "/node/run/run.sh"       16 minutes ago   Up 16 minutes   4160/tcp, 9100/tcp, 0.0.0.0:9392->9392/tcp, :::9392->9392/tcp, 0.0.0.0:4002->7833/tcp, :::4002->7833/tcp, 0.0.0.0:4001->8080/tcp, :::4001->8080/tcp   algokit_sandbox_algod
# Ports fülön a portok public-ká tétele, a lakatra történő kattintással
# Dappflow blokklánc vizsgáló indítása
gitpod /workspace/akt02 (main) $algokit explore
# Ismert hiba: megnyílik egy Dappflow ablak, de a blokklánc vizsgáló nem tud hozzákapcsolódni a localnet-hez
# AlgoKit projekt inicializálás
gitpod /workspace/akt02 (main) $ algokit init
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

A Python API példák futtatása:
```
# Python virtuális környezet inicializálás
gitpod /workspace/akt02 (main) $ source /workspace/akt02/hellow/.venv/bin/activate
# Könyvtár váltás a példákhoz
(playground-py3.12) gitpod /workspace/akt02 (main) $ cd hellow/playground/python_api/
# Példák futtatása, pl.
(playground-py3.12) gitpod /workspace/akt02/hellow/playground/python_api (main) $ python 01_make_account.py 
My address: SLMUFFYSZGVKVD23ESX4G5MAXROMKLSH3GDEOGJHADER3FWY7ZACYZ2IHA
My private key: lxwXp+iNEjsdPCKaZlj1BHxoa25Bf3yZ1ekFz6Fz26yS2UKXEsmqqo9bJK/DdYC8XMUuR9mGRxknAMkdltj+QA==
My passphrase: napkin fragile fatal teach celery excite thought captain spy ghost kingdom scare special onion arena leg convince filter visual utility drum table grocery absent mother
```

A JS API példák futtatása:
```
# Könyvtár váltás a példákhoz
(playground-py3.12) gitpod /workspace/akt02 (main) $ cd hellow/playground/js_api/
# Példák futtatása, pl.
gitpod /workspace/akt02 (main) $ cd hellow/playground/js_api
gitpod /workspace/akt02/hellow/playground/js_api (main) $ node 01-account_generation.js 
Account address: UWGHPYNAIDYGVUSGCHPNBRBU2I2D6IZGNCLQ2IRMYKX2KJUSD4YXF4E22Q
Private key: nCM+WEuDmrunF70HRqDIXln6UUHHxGv11EsfQQeFd3yljHfhoEDwatJGEd7QxDTSND8jJmiXDSIswq+lJpIfMQ==
Account mnemonic: inform weasel project cruise crush upon rule rug science library gold nominee visa federal deliver shadow pulp fatigue planet ball attend throw together about employ
gitpod /workspace/akt02/hellow/playground/js_api (main) $
```


