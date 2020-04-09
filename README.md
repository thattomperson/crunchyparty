# chat-app

&nbsp;

Instantly deploy a zero configuration serverless chat app to AWS in seconds using [Serverless Components](https://github.com/serverless/components).

&nbsp;

1. [Install](#1-install)
2. [Create](#2-create)
3. [Configure](#3-configure)
4. [Deploy](#4-deploy)

&nbsp;

### 1. Install

```
$ npm install -g serverless
```

### 2. Create

Just create `serverless.yml` and `.env` files.

```console
$ touch serverless.yml
$ touch .env      # your AWS api keys
```

```
# .env
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
```

### 3. Configure

```yml
# serverless.yml

myChatApp:
  component: '@serverless/chat-app'
  inputs: # all inputs are optional :)
    colorBackground: white
    colorInputText: black
    logoUrl: null
```

### 4. Deploy

```console
$ serverless
```

&nbsp;

### New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
