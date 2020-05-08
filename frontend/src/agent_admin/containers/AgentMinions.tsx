// Libraries
import React, {PureComponent, Dispatch} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'
import yaml from 'js-yaml'

// Components
import Threesizer from 'src/shared/components/threesizer/Threesizer'
import AgentMinionsTable from 'src/agent_admin/components/AgentMinionsTable'
import AgentMinionsConsole from 'src/agent_admin/components/AgentMinionsConsole'
import AgentMinionsModal from 'src/agent_admin/components/AgentMinionsModal'

// SaltStack
import {
  getLocalGrainsItem,
  runAcceptKey,
  runRejectKey,
  runDeleteKey,
} from 'src/shared/apis/saltStack'

// Action
import {
  getMinionKeyListAllAsync,
  getMinionsIPAsync,
  getMinionsOSAsync,
} from 'src/agent_admin/actions'

// Notification
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Constants
import {HANDLE_HORIZONTAL} from 'src/shared/constants'

// Types
import {RemoteDataState, Notification, NotificationFunc} from 'src/types'
import {Minion, MinionsObject} from 'src/agent_admin/type'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Error
// import {errorThrown} from 'src/shared/actions/errors'
import {ErrorThrownAction} from 'src/types/actions/errors'

interface Props {
  notify: (message: Notification | NotificationFunc) => void
  isUserAuthorized: boolean
  currentUrl: string
  saltMasterUrl: string
  saltMasterToken: string
  getMinionKeyListAllAsync: (
    pUrl: string,
    pToken: string
  ) => (dispatch: Dispatch<ErrorThrownAction>) => Promise<MinionsObject>
  getMinionsIPAsync: (
    pUrl: string,
    pToken: string,
    minions: MinionsObject
  ) => (dispatch: Dispatch<ErrorThrownAction>) => Promise<MinionsObject>
  getMinionsOSAsync: (
    pUrl: string,
    pToken: string,
    minions: MinionsObject
  ) => (dispatch: Dispatch<ErrorThrownAction>) => Promise<MinionsObject>
}
interface State {
  MinionsObject: {[x: string]: Minion}
  minionsPageStatus: RemoteDataState
  minionLog: string
  currentUrl: string
  proportions: number[]
  focusedHost: string
}

@ErrorHandling
export class AgentMinions extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      minionLog: '<< Empty >>',
      proportions: [0.43, 0.57],
      MinionsObject: {},
      currentUrl: '',
      minionsPageStatus: RemoteDataState.NotStarted,
      focusedHost: '',
    }
  }
  public getWheelKeyListAll = async ({
    saltMasterUrl,
    saltMasterToken,
  }: {
    saltMasterUrl: string
    saltMasterToken: string
  }) => {
    try {
      const {
        getMinionKeyListAllAsync,
        getMinionsIPAsync,
        getMinionsOSAsync,
      } = this.props

      const response: MinionsObject = await getMinionKeyListAllAsync(
        saltMasterUrl,
        saltMasterToken
      )

      console.log({response})
      const updateMinionsIP = await getMinionsIPAsync(
        saltMasterUrl,
        saltMasterToken,
        response
      )

      return await getMinionsOSAsync(
        saltMasterUrl,
        saltMasterToken,
        updateMinionsIP
      )
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  public async componentWillMount() {
    const {saltMasterUrl, saltMasterToken} = this.props

    try {
      this.setState({minionsPageStatus: RemoteDataState.Loading})
      const newMinions = await this.getWheelKeyListAll({
        saltMasterUrl,
        saltMasterToken,
      })

      this.setState({
        MinionsObject: newMinions,
        minionsPageStatus: RemoteDataState.Done,
      })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  public async componentDidUpdate(nextProps) {
    if (nextProps.saltMasterToken !== this.props.saltMasterToken) {
      if (
        this.props.saltMasterToken !== '' &&
        this.props.saltMasterToken !== null
      ) {
        try {
          this.setState({minionsPageStatus: RemoteDataState.Loading})
          const {saltMasterUrl, saltMasterToken} = this.props
          const newMinions = await this.getWheelKeyListAll({
            saltMasterUrl,
            saltMasterToken,
          })

          this.setState({
            MinionsObject: newMinions,
            minionsPageStatus: RemoteDataState.Done,
          })
        } catch (error) {
          console.error(error)
          throw error
        }
      } else if (
        this.props.saltMasterToken === null ||
        this.props.saltMasterToken === ''
      ) {
        this.setState({MinionsObject: null})
      }
    }
  }

  private onClickTableRowCall = (host: string) => async () => {
    const {saltMasterUrl, saltMasterToken} = this.props
    const {MinionsObject} = this.state
    this.setState({
      focusedHost: host,
      minionsPageStatus: RemoteDataState.Loading,
    })

    if (MinionsObject[host].status === 'Accept') {
      try {
        const {data} = await getLocalGrainsItem(
          saltMasterUrl,
          saltMasterToken,
          host
        )

        this.setState({
          minionLog: yaml.dump(data.return[0][host]),
          minionsPageStatus: RemoteDataState.Done,
        })
      } catch (error) {
        console.error(error)
        throw error
      }
    } else {
      this.setState({
        minionLog: '',
        minionsPageStatus: RemoteDataState.Done,
      })
    }
  }

  private handleWheelKeyCommand = (
    host: string,
    cmdstatus: string
  ) => async () => {
    const {saltMasterUrl, saltMasterToken} = this.props
    this.setState({minionsPageStatus: RemoteDataState.Loading})
    if (cmdstatus === 'ReJect') {
      try {
        const {data} = await runRejectKey(saltMasterUrl, saltMasterToken, host)
        const newMinions = await this.getWheelKeyListAll({
          saltMasterUrl,
          saltMasterToken,
        })

        this.setState({
          MinionsObject: newMinions,
          minionLog: yaml.dump(data.return[0]),
        })
      } catch (error) {
        console.error(error)
        throw error
      }
    } else if (cmdstatus === 'Accept') {
      try {
        const {data} = await runAcceptKey(saltMasterUrl, saltMasterToken, host)

        const newMinions = this.getWheelKeyListAll({
          saltMasterUrl,
          saltMasterToken,
        })

        this.setState({
          MinionsObject: newMinions,
          minionLog: yaml.dump(data.return[0]),
        })
      } catch (error) {
        console.error(error)
        throw error
      }
    } else if (cmdstatus === 'Delete') {
      try {
        const {data} = await runDeleteKey(saltMasterUrl, saltMasterToken, host)
        const newMinions = await this.getWheelKeyListAll({
          saltMasterUrl,
          saltMasterToken,
        })

        this.setState({
          MinionsObject: newMinions,
          minionLog: yaml.dump(data.return[0]),
        })
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }

  public onClickModalCall({
    name,
    host,
    status,
    _this,
    idx,
    handleWheelKeyCommand,
  }: {
    name: string
    host: string
    status: string
    _this: HTMLElement
    idx: number
    handleWheelKeyCommand: () => void
  }) {
    return (
      <AgentMinionsModal
        name={name}
        host={host}
        idx={idx}
        status={status}
        targetObject={_this}
        handleWheelKeyCommand={handleWheelKeyCommand}
      />
    )
  }

  public render() {
    const {isUserAuthorized} = this.props
    return (
      <>
        {isUserAuthorized ? (
          <div className="panel panel-solid">
            <Threesizer
              orientation={HANDLE_HORIZONTAL}
              divisions={this.horizontalDivisions}
              onResize={this.handleResize}
            />
          </div>
        ) : (
          <div className="generic-empty-state agent-table--empty-state">
            <h4>Not Allowed User</h4>
          </div>
        )}
      </>
    )
  }

  private handleResize = (proportions: number[]) => {
    this.setState({proportions})
  }

  private renderAgentPageTop = () => {
    const {MinionsObject, minionsPageStatus, focusedHost} = this.state
    return (
      <AgentMinionsTable
        minions={_.values(MinionsObject)}
        minionsPageStatus={minionsPageStatus}
        onClickTableRow={this.onClickTableRowCall}
        onClickModal={this.onClickModalCall}
        handleWheelKeyCommand={this.handleWheelKeyCommand}
        focusedHost={focusedHost}
      />
    )
  }

  private renderAgentPageBottom = () => {
    const {minionLog} = this.state
    return <AgentMinionsConsole res={minionLog} />
  }

  private get horizontalDivisions() {
    const {proportions} = this.state
    const [topSize, bottomSize] = proportions

    return [
      {
        name: '',
        handleDisplay: 'none',
        headerButtons: [],
        menuOptions: [],
        render: this.renderAgentPageTop,
        headerOrientation: HANDLE_HORIZONTAL,
        size: topSize,
      },
      {
        name: '',
        handlePixels: 8,
        headerButtons: [],
        menuOptions: [],
        render: this.renderAgentPageBottom,
        headerOrientation: HANDLE_HORIZONTAL,
        size: bottomSize,
      },
    ]
  }
}

const mdtp = {
  getMinionKeyListAllAsync,
  getMinionsIPAsync,
  getMinionsOSAsync,
  notify: notifyAction,
}

export default connect(null, mdtp, null)(AgentMinions)
