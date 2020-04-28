// Libraries
import React, {PureComponent} from 'react'
import {Graph} from 'react-d3-graph'
import classnames from 'classnames'
import _ from 'lodash'

// Components
import {
  Table,
  TableBody,
  TableBodyRowItem,
  usageIndacator,
} from 'src/addon/128t/reusable/layout'
import {fixedDecimalPercentage} from 'src/shared/utils/decimalPlaces'
import LoadingSpinner from 'src/flux/components/LoadingSpinner'

// Middleware
import {
  setLocalStorage,
  getLocalStorage,
} from 'src/shared/middleware/localStorage'

// constants
import {TOPOLOGY_TABLE_SIZING} from 'src/addon/128t/constants'

// Error Handler
import {ErrorHandling} from 'src/shared/decorators/errors'

//type
import {Router} from 'src/addon/128t/types'

interface SwanTopology {
  id: string
  x: number
  y: number
}

interface GraphNodeData {
  nodes: GraphNode[]
  links: GraphLink[]
}

interface GraphNode {
  id: string
  name?: string
  label?: string
  x?: number
  y?: number
  size?: number
  svg?: string
  labelPosition?: string
}

interface GraphLink {
  source: string
  target: string
}

interface Props {
  routersData: Router[]
}

interface State {
  nodeData: GraphNodeData
}

@ErrorHandling
class TopologyRanderer extends PureComponent<Props, State> {
  private useRef = React.createRef<HTMLDivElement>()

  private imgTopNodeUrl = require('src/addon/128t/components/assets/topology-cloudhub.svg')
  private iconCooldinate = require('src/addon/128t/components/assets/icon_cooldinate.svg')

  private defaultMargin = {left: 100, right: 100, top: 100, bottom: 400}
  private config = {
    width: '100%',
    height: '100%',
    nodeHighlightBehavior: true,
    staticGraphWithDragAndDrop: true,
    directed: false,
    node: {
      color: '#f58220',
      fontColor: '#fff',
      size: 2000,
      fontSize: 16,
      fontWeight: 'normal',
      highlightFontSize: 16,
      highlightStrokeColor: 'blue',
      renderLabel: false,
      symbolType: 'circle',
    },
    link: {
      highlightColor: '#f58220',
    },
    d3: {
      alphaTarget: 0.05,
      gravity: -400,
      linkLength: 300,
      linkStrength: 1,
      disableLinkForce: true,
    },
  }
  private containerStyles = {
    width: '100%',
    height: '100%',
    backgroundColor: '#292933',
  }

  private initNodes = [
    {
      id: 'root',
      label: 'CloudHub',
      svg: this.imgTopNodeUrl,
      size: 600,
      labelPosition: 'top',
    },
  ]

  private TOPOLOGY_ROLE = {
    COUNDUCTOR: 'conductor',
    COMBO: 'combo',
    ROOT: 'root',
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      nodeData: {
        nodes: this.initNodes,
        links: null,
      },
    }
  }

  public onNodePositionChange = (
    nodeId: string,
    x: number,
    y: number
  ): void => {
    const {nodeData} = this.state
    const addon = getLocalStorage('addon')
    let {swanTopology}: {swanTopology: SwanTopology[]} = addon

    const nodes = nodeData.nodes.map(m => {
      if (m.id === nodeId) {
        const filtered = swanTopology.filter(s => s.id === nodeId)
        if (filtered.length > 0) {
          swanTopology = swanTopology.map(swan =>
            swan.id === nodeId ? {id: nodeId, x, y} : swan
          )

          setLocalStorage('addon', {
            ...addon,
            swanTopology,
          })
        } else {
          swanTopology.push({id: nodeId, x, y})
          setLocalStorage('addon', {
            ...addon,
            swanTopology,
          })
        }
        return {...m, x, y}
      } else {
        return m
      }
    })

    this.setState({
      nodeData: {
        ...nodeData,
        nodes,
      },
    })
  }

  public componentWillMount() {
    const {routersData} = this.props
    const nodes = routersData.map(m =>
      m.role === this.TOPOLOGY_ROLE.COUNDUCTOR
        ? {id: m.assetId, label: m.assetId}
        : {
            id: m.assetId,
            label: m.assetId,
          }
    )

    const links = routersData.map(m => ({
      source: this.TOPOLOGY_ROLE.ROOT,
      target: m.assetId,
    }))

    const nodeData: GraphNodeData = {
      nodes,
      links,
    }

    this.setState({
      nodeData: {
        nodes: this.state.nodeData.nodes.concat(nodeData.nodes),
        links: nodeData.links,
      },
    })
  }

  public componentDidMount() {
    const {nodeData} = this.state
    const dimensions = this.useRef.current.getBoundingClientRect()
    const addon = getLocalStorage('addon')
    const check = addon.hasOwnProperty('swanTopology')

    let nodes = nodeData.nodes.map((m, index) =>
      m.id === 'root'
        ? {...m, x: dimensions.width / 2, y: this.defaultMargin.top}
        : {
            ...m,
            x: this.getXCoordinate(index),
            y: dimensions.height - this.defaultMargin.bottom,
            viewGenerator: (node: GraphNode) => this.generateCustomNode({node}),
          }
    )

    if (check) {
      const {swanTopology}: {swanTopology: SwanTopology[]} = addon
      nodes = nodes.map(m => {
        const filtered = swanTopology.filter(s => s.id === m.id)
        if (filtered.length > 0) {
          const {x, y} = filtered[0]
          return {
            ...m,
            x,
            y,
          }
        } else {
          return m
        }
      })
    } else {
      const {id, x, y} = nodes[0]
      setLocalStorage('addon', {
        ...addon,
        swanTopology: [{id, x, y}],
      })
    }

    this.setState({
      nodeData: {
        ...nodeData,
        nodes,
      },
    })
  }

  public render() {
    const {nodeData} = this.state

    return (
      <div style={this.containerStyles} ref={this.useRef}>
        {nodeData.nodes[0].x > 0 ? (
          <Graph
            id="swan-topology"
            data={nodeData}
            config={this.config}
            onNodePositionChange={this.onNodePositionChange}
          />
        ) : (
          <LoadingSpinner />
        )}
      </div>
    )
  }

  private getXCoordinate(index: number) {
    return this.defaultMargin.left + 220 * index
  }

  private generateCustomNode = ({node}: {node: GraphNode}) => {
    const {routersData} = this.props
    const routerData = _.find(routersData, r => r.assetId === node.id)
    const {
      assetId,
      cpuUsage,
      diskUsage,
      memoryUsage,
      locationCoordinates,
      role,
    } = routerData
    const {TABLE_ROW_IN_HEADER, TABLE_ROW_IN_BODY} = TOPOLOGY_TABLE_SIZING

    return (
      <div
        className={classnames('topology-table-container', {
          unconnected: cpuUsage === null,
        })}
      >
        {locationCoordinates ? (
          <span className={'icon-container'}>
            <img src={this.iconCooldinate} />
          </span>
        ) : null}
        <strong className={'hosts-table-title'}>{assetId}</strong>
        <Table>
          <TableBody>
            <>
              <div className={this.focusedClasses()}>
                <div
                  className={this.headerClasses()}
                  style={{width: TABLE_ROW_IN_HEADER}}
                >
                  cpu usage
                </div>
                <TableBodyRowItem
                  title={usageIndacator({
                    value: fixedDecimalPercentage(cpuUsage, 2),
                  })}
                  width={TABLE_ROW_IN_BODY}
                ></TableBodyRowItem>
              </div>
              <div className={this.focusedClasses()}>
                <div
                  className={this.headerClasses()}
                  style={{width: TABLE_ROW_IN_HEADER}}
                >
                  disk usage
                </div>
                <TableBodyRowItem
                  title={usageIndacator({
                    value: fixedDecimalPercentage(diskUsage, 2),
                  })}
                  width={TABLE_ROW_IN_BODY}
                ></TableBodyRowItem>
              </div>
              <div className={this.focusedClasses()}>
                <div
                  className={this.headerClasses()}
                  style={{width: TABLE_ROW_IN_HEADER}}
                >
                  memory usage
                </div>
                <TableBodyRowItem
                  title={usageIndacator({
                    value: fixedDecimalPercentage(memoryUsage, 2),
                  })}
                  width={TABLE_ROW_IN_BODY}
                ></TableBodyRowItem>
              </div>
            </>
          </TableBody>
        </Table>
        <div
          className={classnames('table-background', {
            'bg-combo': role === this.TOPOLOGY_ROLE.COMBO,
            'bg-conductor': role === this.TOPOLOGY_ROLE.COUNDUCTOR,
          })}
        ></div>
      </div>
    )
  }

  private focusedClasses = (): string => {
    return 'hosts-table--tr'
  }

  private headerClasses = (): string => {
    return 'hosts-table--th'
  }
}

export default TopologyRanderer
