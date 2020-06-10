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
  usageTemperature,
  usageSound,
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
import {isUserAuthorized, SUPERADMIN_ROLE} from 'src/auth/Authorized'

// Error Handler
import {ErrorHandling} from 'src/shared/decorators/errors'

//type
import {RouterNode, GroupRouterNodeData} from 'src/addon/128t/types'

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
  role?: string
  routerNode?: RouterNode
  temperature?: number
  sound?: number
}

interface GraphLink {
  source: string
  target: string
}

interface Props {
  isUsingAuth: boolean
  meRole: string
  groupRouterNodesData: GroupRouterNodeData[]
}

interface State {
  nodeData: GraphNodeData
}

@ErrorHandling
class TopologyRenderer extends PureComponent<Props, State> {
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
      size: 10,
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
      role: 'root',
      svg: this.imgTopNodeUrl,
      size: 600,
      labelPosition: 'top',
    },
  ]

  private TOPOLOGY_ROLE = {
    ROOT: 'root',
    GROUP: 'group',
    ROUTER: 'router',
    COUNDUCTOR: 'conductor',
    COMBO: 'combo',
  }

  private dummyData = {
    links: [
      {
        source: 'SDPLEX_Seoul_TEST',
        target: 'CNC 01',
      },
      {
        source: 'SDPLEX_Seoul_TEST',
        target: 'CNC 02',
      },
      {
        source: 'SDPLEX-Seoul_TEST3',
        target: 'CNC 03',
      },
      {
        source: 'snet-china-soju',
        target: 'CNC 04',
      },
      {
        source: 'snet-china-soju',
        target: 'CNC 05',
      },
      {
        source: 'snet-indonesia',
        target: 'CNC 06',
      },
      {
        source: 'snet-seoul-office',
        target: 'CNC 07',
      },
      {
        source: 'snet-hanoi',
        target: 'CNC 08',
      },
      {
        source: 'snet-hochiminh',
        target: 'CNC 09',
      },
      {
        source: 'snet-hochiminh',
        target: 'CNC 10',
      },
    ],
    nodes: [
      {
        id: 'CNC 01',
        name: 'CNC 01',
        x: 150,
        y: 760,
        role: 'machine',
        temperature: 35,
        sound: 40,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
      {
        id: 'CNC 02',
        name: 'CNC 02',
        x: 370,
        y: 760,
        role: 'machine',
        temperature: 51,
        sound: 56,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
      {
        id: 'CNC 03',
        name: 'CNC 03',
        x: 590,
        y: 760,
        role: 'machine',
        temperature: 61,
        sound: 66,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
      {
        id: 'CNC 04',
        name: 'CNC 04',
        x: 1640,
        y: 760,
        role: 'machine',
        temperature: null,
        sound: null,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
      {
        id: 'CNC 05',
        name: 'CNC 05',
        x: 1860,
        y: 760,
        role: 'machine',
        temperature: 39,
        sound: 41,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
      {
        id: 'CNC 06',
        name: 'CNC 06',
        x: 2080,
        y: 760,
        role: 'machine',
        temperature: 29,
        sound: 40,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
      {
        id: 'CNC 07',
        name: 'CNC 07',
        x: 2300,
        y: 760,
        role: 'machine',
        temperature: 31,
        sound: 67,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
      {
        id: 'CNC 08',
        name: 'CNC 08',
        x: 2520,
        y: 760,
        role: 'machine',
        temperature: 51,
        sound: 43,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
      {
        id: 'CNC 09',
        name: 'CNC 09',
        x: 2740,
        y: 760,
        role: 'machine',
        temperature: 62,
        sound: 55,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
      {
        id: 'CNC 10',
        name: 'CNC 10',
        x: 2960,
        y: 760,
        role: 'machine',
        temperature: 33,
        sound: 36,
        viewGenerator: (node: GraphNode) => this.generateMachineNode({node}),
      },
    ],
  }

  private addon: {swanTopology?: SwanTopology[]}

  constructor(props: Props) {
    super(props)
    this.state = {
      nodeData: {
        nodes: [],
        links: [],
      },
    }
  }

  public componentDidMount() {
    this.addon = getLocalStorage('addon')
    const dimensions = this.useRef.current.getBoundingClientRect()

    const genNode = this.generatorNodeData({
      dimensions,
    })
    const {nodes, links} = genNode

    this.setState(
      {
        nodeData: {
          nodes,
          links,
        },
      },
      () => {
        this.customNodeStyle()
      }
    )
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.groupRouterNodesData !== this.props.groupRouterNodesData) {
      const dimensions = this.useRef.current.getBoundingClientRect()

      const genNode = this.generatorNodeData({
        dimensions,
      })
      const {nodes, links} = genNode

      this.setState({
        nodeData: {
          nodes,
          links,
        },
      })
    }
  }

  public customNodeStyle = () => {
    this.modifyNodesStyle('.group-node', 200, 30)
    this.modifyNodesStyle('.router-node', 200, 90)
    this.modifyNodesStyle('.machine-node', 200, 90)
  }

  public modifyNodesStyle = (
    nodeClassname: string,
    width: number,
    height: number
  ) => {
    const selectNodes: NodeListOf<Element> = this.useRef.current.querySelectorAll(
      nodeClassname
    )

    selectNodes.forEach((selectNode: Element) => {
      let currentParent: Element | any = selectNode.parentNode

      while (currentParent) {
        if (
          currentParent.tagName === 'g' &&
          currentParent.classList.contains('node')
        ) {
          break
        } else {
          currentParent = currentParent.parentNode
        }
      }

      const svg = currentParent.querySelector('svg')
      const section = currentParent.querySelector('section')

      svg.setAttribute('width', width)
      svg.setAttribute('height', height)
      svg.setAttribute('style', 'overflow: visible')

      section.setAttribute('style', `width:${width}px; height:${height}px`)
    })
  }

  public render() {
    const {nodeData} = this.state

    return (
      <div style={this.containerStyles} ref={this.useRef}>
        {nodeData.nodes.length > 0 ? (
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

  private modifyRoutersData = (
    groupRouterNodesData: GroupRouterNodeData[]
  ): GroupRouterNodeData[] => {
    return groupRouterNodesData.map(g => {
      return {
        groupName: g.groupName,
        routerNodes: g.routerNodes.map(r => {
          const {nodeName} = r
          return {...r, nodeName: nodeName ? nodeName : '-'}
        }),
      }
    })
  }

  private onNodePositionChange = (
    nodeId: string,
    x: number,
    y: number
  ): void => {
    const {nodeData} = this.state

    this.addon = getLocalStorage('addon')

    let {swanTopology} = this.addon

    const nodes = nodeData.nodes.map(m => {
      if (m.id === nodeId) {
        if (swanTopology) {
          const filtered = swanTopology.filter(s => s.id === nodeId)
          if (filtered.length > 0) {
            swanTopology = swanTopology.map(swan =>
              swan.id === nodeId ? {id: nodeId, x, y} : swan
            )

            setLocalStorage('addon', {
              ...this.addon,
              swanTopology,
            })
          } else {
            swanTopology.push({id: nodeId, x, y})
            setLocalStorage('addon', {
              ...this.addon,
              swanTopology,
            })
          }
        } else {
          swanTopology.push({id: nodeId, x, y})
          setLocalStorage('addon', {
            ...this.addon,
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

  private generatorNodeData = ({
    dimensions,
  }: {
    nodeData?: GraphNodeData
    dimensions?: DOMRect
  }): GraphNodeData => {
    const isLocalstorage: boolean = this.addon.hasOwnProperty('swanTopology')
    const {isUsingAuth, meRole, groupRouterNodesData} = this.props
    const customGroupRoutersData = this.modifyRoutersData(groupRouterNodesData)

    let nodesData: GraphNodeData = null

    if (!isUsingAuth || isUserAuthorized(meRole, SUPERADMIN_ROLE)) {
      if (customGroupRoutersData) {
        let nodeData = _.reduce(
          customGroupRoutersData,
          (nodeData: GraphNodeData, groupRouterNode: GroupRouterNodeData) => {
            nodeData = {
              ...nodeData,
              nodes: [
                ...nodeData.nodes,
                {
                  id: groupRouterNode.groupName,
                  label: groupRouterNode.groupName,
                  role: this.TOPOLOGY_ROLE.GROUP,
                },
              ],
              links: [
                ...nodeData.links,
                {
                  source: this.TOPOLOGY_ROLE.ROOT,
                  target: groupRouterNode.groupName,
                },
              ],
            }

            if (groupRouterNode.routerNodes.length > 0) {
              const routerNodeData = _.reduce(
                groupRouterNode.routerNodes,
                (routerNodeData: GraphNodeData, routerNode: RouterNode) => {
                  if (routerNode.nodeName !== '-') {
                    routerNodeData = {
                      ...routerNodeData,
                      nodes: [
                        ...routerNodeData.nodes,
                        {
                          id: routerNode.nodeName,
                          label: routerNode.nodeName,
                          role: this.TOPOLOGY_ROLE.ROUTER,
                          routerNode: routerNode,
                        },
                      ],
                      links: [
                        ...routerNodeData.links,
                        {
                          source: groupRouterNode.groupName,
                          target: routerNode.nodeName,
                        },
                      ],
                    }
                  }
                  return routerNodeData
                },
                {nodes: [], links: []}
              )

              nodeData = {
                ...nodeData,
                nodes: nodeData.nodes.concat(routerNodeData.nodes),
                links: nodeData.links.concat(routerNodeData.links),
              }
            }

            return nodeData
          },
          {nodes: [], links: []}
        )

        nodeData = {...nodeData, nodes: nodeData.nodes.concat(this.initNodes)}

        nodesData = nodeData
      }
    } else {
      if (customGroupRoutersData) {
        let nodeData = _.reduce(
          customGroupRoutersData,
          (nodeData: GraphNodeData, groupRouterNode: GroupRouterNodeData) => {
            if (groupRouterNode.routerNodes.length > 0) {
              const routerNodeData = _.reduce(
                groupRouterNode.routerNodes,
                (routerNodeData: GraphNodeData, routerNode: RouterNode) => {
                  if (routerNode.nodeName !== '-') {
                    routerNodeData = {
                      ...routerNodeData,
                      nodes: [
                        ...routerNodeData.nodes,
                        {
                          id: routerNode.nodeName,
                          label: routerNode.nodeName,
                          role: this.TOPOLOGY_ROLE.ROUTER,
                          routerNode: routerNode,
                        },
                      ],
                      links: [
                        ...routerNodeData.links,
                        {
                          source: this.TOPOLOGY_ROLE.ROOT,
                          target: routerNode.nodeName,
                        },
                      ],
                    }
                  }
                  return routerNodeData
                },
                {nodes: [], links: []}
              )

              nodeData = {
                ...nodeData,
                nodes: nodeData.nodes.concat(routerNodeData.nodes),
                links: nodeData.links.concat(routerNodeData.links),
              }
            }

            return nodeData
          },
          {nodes: [], links: []}
        )

        nodeData = {...nodeData, nodes: nodeData.nodes.concat(this.initNodes)}

        nodesData = nodeData
      }
    }

    let nodesInfo: GraphNodeData = {
      nodes: [],
      links: [],
    }

    let {nodes, links} = nodesInfo

    let gIndex = 0
    let rIndex = 0

    nodes = nodesData.nodes.map(m => {
      if (m.role === 'root') {
        return {...m, x: dimensions.width / 2, y: this.defaultMargin.top}
      } else if (m.role === 'group') {
        return {
          ...m,
          x: this.getXCoordinate(gIndex++, m.role),
          y: this.defaultMargin.top + 120,
          viewGenerator: (node: GraphNode) =>
            this.GenerateGroupNode({
              node,
            }),
        }
      } else if (m.role === 'router') {
        return {
          ...m,
          x: this.getXCoordinate(rIndex++, m.role),
          y: dimensions.height - this.defaultMargin.bottom,
          viewGenerator: (node: GraphNode) =>
            this.GenerateRouterNode({
              node,
            }),
        }
      } else {
        return {
          ...m,
        }
      }
    })

    if (
      this.dummyData.nodes.filter(dummyNode => {
        const nodes = nodesData.nodes.filter(node => {
          if (node.id && node.id === dummyNode.id) return dummyNode
        })
        if (nodes.length > 0) return nodes
      }).length <= 0
    ) {
      const filteredLinks = this.dummyData.links.filter(dummyLink => {
        const links = nodesData.nodes.filter(node => {
          if (node.id && node.id === dummyLink.source) return dummyLink
        })

        if (links.length > 0) return links
      })

      const filteredNodes = this.dummyData.nodes.filter(node => {
        const nodes = filteredLinks.filter(link => {
          if (node.id && node.id === link.target) return node
        })
        if (nodes.length > 0) return nodes
      })

      nodes = nodes.concat(filteredNodes)

      links = nodesData.links.concat(filteredLinks)

      links = _.remove(links, link => {
        return link.target !== '-'
      })
    } else {
      links = nodesData.links
    }

    if (isLocalstorage) {
      const {swanTopology} = this.addon
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
        ...this.addon,
        swanTopology: [{id, x, y}],
      })
    }

    return {
      nodes,
      links,
    }
  }

  private getXCoordinate(index: number, role: string) {
    let xCoordinate: number = 0
    if (role === this.TOPOLOGY_ROLE.GROUP) {
      xCoordinate = this.defaultMargin.left + 100 + 400 * index
    } else {
      xCoordinate = this.defaultMargin.left + 220 * index
    }
    return xCoordinate
  }

  private GenerateGroupNode = ({node}: {node: GraphNode}) => {
    return (
      <div className={classnames('topology-table-container group-node')}>
        <strong className={'hosts-table-title'}>
          <div className={classnames('topology-group-title-container')}>
            {node.id}
          </div>
        </strong>
      </div>
    )
  }

  private GenerateRouterNode = ({node}: {node: GraphNode}) => {
    const routerData = node.routerNode

    if (!routerData) return

    const {
      nodeName,
      cpuUsage,
      diskUsage,
      memoryUsage,
      locationCoordinates,
      role,
    } = routerData

    const {TABLE_ROW_IN_HEADER, TABLE_ROW_IN_BODY} = TOPOLOGY_TABLE_SIZING

    return (
      <div
        className={classnames('topology-table-container router-node', {
          unconnected: cpuUsage === null,
        })}
      >
        {locationCoordinates ? (
          <span className={'icon-container'}>
            <img src={this.iconCooldinate} />
          </span>
        ) : null}
        <strong className={'hosts-table-title'}>{nodeName}</strong>
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

  private generateMachineNode = ({node}: {node: GraphNode}) => {
    const {TABLE_ROW_IN_HEADER, TABLE_ROW_IN_BODY} = TOPOLOGY_TABLE_SIZING

    return (
      <div
        className={classnames('topology-table-container machine-node', {
          unconnected: node.sound === null,
        })}
      >
        <strong className={'hosts-table-title'}>{node.id}</strong>
        <Table>
          <TableBody>
            <>
              <div className={this.focusedClasses()}>
                <div
                  className={this.headerClasses()}
                  style={{width: TABLE_ROW_IN_HEADER}}
                >
                  TEMP
                </div>
                <TableBodyRowItem
                  title={
                    node.temperature !== null
                      ? usageTemperature({
                          value: `${node.temperature} ˚C`,
                        })
                      : '-'
                  }
                  width={TABLE_ROW_IN_BODY}
                ></TableBodyRowItem>
              </div>
              <div className={this.focusedClasses()}>
                <div
                  className={this.headerClasses()}
                  style={{width: TABLE_ROW_IN_HEADER}}
                >
                  SOUND
                </div>
                <TableBodyRowItem
                  title={
                    node.sound !== null
                      ? usageSound({
                          value: `${node.sound} dB`,
                        })
                      : '-'
                  }
                  width={TABLE_ROW_IN_BODY}
                ></TableBodyRowItem>
              </div>
            </>
          </TableBody>
        </Table>
        <div className={classnames('table-background bg-machine')}></div>
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

export default TopologyRenderer
