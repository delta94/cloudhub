import React, {Component} from 'react'
import PropTypes from 'prop-types'

import _ from 'lodash'

import {QueryConfig, Source, Me} from 'src/types'
import {Namespace} from 'src/types/queries'

import DatabaseListItem from 'src/shared/components/DatabaseListItem'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {getDatabasesWithRetentionPolicies} from 'src/shared/apis/databases'
import {isUserAuthorized, SUPERADMIN_ROLE} from 'src/auth/Authorized'

interface DatabaseListProps {
  query: QueryConfig
  querySource?: Source
  onChooseNamespace: (namespace: Namespace) => void
  source?: Source
  me?: Me
  isUsingAuth: boolean
}

interface DatabaseListState {
  namespaces: Namespace[]
}

const {shape} = PropTypes

@ErrorHandling
class DatabaseList extends Component<DatabaseListProps, DatabaseListState> {
  public static contextTypes = {
    source: shape({
      links: shape({}).isRequired,
    }).isRequired,
  }

  public static defaultProps: Partial<DatabaseListProps> = {
    source: null,
  }

  constructor(props) {
    super(props)
    this.getDbRp = this.getDbRp.bind(this)
    this.handleChooseNamespace = this.handleChooseNamespace.bind(this)
    this.state = {
      namespaces: [],
    }
  }

  public componentDidMount() {
    this.getDbRp()
  }

  public componentDidUpdate({
    querySource: prevSource,
    query: prevQuery,
  }: {
    querySource?: Source
    query: QueryConfig
  }) {
    const {querySource: nextSource, query: nextQuery} = this.props
    const differentSource = !_.isEqual(prevSource, nextSource)

    const newMetaQuery =
      nextQuery.rawText &&
      nextQuery.rawText.match(/^(create|drop)/i) &&
      nextQuery.rawText !== prevQuery.rawText

    if (differentSource || newMetaQuery) {
      this.getDbRp()
    }
  }

  public async getDbRp() {
    const {source} = this.context
    const {querySource, me, isUsingAuth} = this.props
    const proxy = _.get(querySource, ['links', 'proxy'], source.links.proxy)
    const currentOrganization = _.get(me, 'currentOrganization.name')

    try {
      const sorted = await getDatabasesWithRetentionPolicies(proxy)

      if (sorted && sorted.length > 0) {
        let roleNamespace: Namespace[]

        if (isUserAuthorized(me.role, SUPERADMIN_ROLE) || !isUsingAuth) {
          this.setState({namespaces: sorted})
        } else {
          roleNamespace = _.filter(
            sorted,
            sorted => sorted.database === currentOrganization
          )

          this.setState({namespaces: roleNamespace})
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  public handleChooseNamespace(namespace: Namespace) {
    return () => this.props.onChooseNamespace(namespace)
  }

  public isActive(query: QueryConfig, {database, retentionPolicy}: Namespace) {
    return (
      database === query.database && retentionPolicy === query.retentionPolicy
    )
  }

  public render() {
    return (
      <div className="query-builder--column query-builder--column-db">
        <div className="query-builder--heading">DB.RetentionPolicy</div>
        <div className="query-builder--list">
          <FancyScrollbar>
            {this.state.namespaces.map(namespace => (
              <DatabaseListItem
                isActive={this.isActive(this.props.query, namespace)}
                namespace={namespace}
                onChooseNamespace={this.handleChooseNamespace}
                key={namespace.database + namespace.retentionPolicy}
              />
            ))}
          </FancyScrollbar>
        </div>
      </div>
    )
  }
}

export default DatabaseList
