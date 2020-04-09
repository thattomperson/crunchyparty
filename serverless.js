/*
 * Component – ChatApp
 */

const path = require('path')
const { Component } = require('@serverless/core')

/*
 * Class – ChatApp
 */

class ChatApp extends Component {
  /*
   * Default
   */

  async default(inputs = {}) {
    this.context.status(`Deploying`)

    // Merge inputs with defaults
    const defaults = {
      colorBackground: '#000000',
      colorInputText: '#FFFFFF',
      logoUrl: null
    }
    inputs = Object.assign(defaults, inputs)

    // Deploy the DynamoDB table...
    const dbConnections = await this.load('@serverless/aws-dynamodb', 'connections')
    const dbConnectionsOutputs = await dbConnections({
      attributeDefinitions: [
        {
          AttributeName: 'roomId',
          AttributeType: 'S'
        }
      ],
      keySchema: [
        {
          AttributeName: 'roomId',
          KeyType: 'HASH'
        }
      ]
    })

    const website = await this.load('@serverless/website')
    const socket = await this.load('@serverless/backend-socket')

    const socketOutputs = await socket({
      code: path.join(__dirname, 'backend'),
      env: {
        dbConnectionsName: dbConnectionsOutputs.name
      }
    })

    const websiteOutputs = await website({
      code: {
        src: 'build',
        root: path.join(__dirname, 'frontend'),
        hook: `SOCKET_URL=${socketOutputs.url} npm run build`
      },
    })

    const outputs = {
      frontend: websiteOutputs.url,
      backend: socketOutputs.url,
    }

    // Save state
    this.state.url = outputs.frontend.url
    await this.save()

    return outputs
  }

  /*
   * Remove
   */

  async remove() {
    this.ui.status('Removing')

    // Deploy the DynamoDB table...
    const dbConnections = await this.load('@serverless/aws-dynamodb', 'connections')
    await dbConnections.remove()

    const realtimeApp = await this.load('@serverless/realtime-app')
    await realtimeApp.remove()

    this.state = {}
    await this.save()
    return {}
  }
}

module.exports = ChatApp
