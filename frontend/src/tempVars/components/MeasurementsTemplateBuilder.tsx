import React, {PureComponent} from 'react'
import _ from 'lodash'

import {ErrorHandling} from 'src/shared/decorators/errors'
import Dropdown from 'src/shared/components/Dropdown'
import {showDatabases, showMeasurements} from 'src/shared/apis/metaQuery'
import parseShowDatabases from 'src/shared/parsing/showDatabases'
import parseShowMeasurements from 'src/shared/parsing/showMeasurements'
import TemplateMetaQueryPreview from 'src/tempVars/components/TemplateMetaQueryPreview'
import DropdownLoadingPlaceholder from 'src/shared/components/DropdownLoadingPlaceholder'

import {
  TemplateBuilderProps,
  RemoteDataState,
  TemplateValueType,
} from 'src/types'

import {isUserAuthorized, SUPERADMIN_ROLE} from 'src/auth/Authorized'

interface State {
  databases: string[]
  databasesStatus: RemoteDataState
  selectedDatabase: string
  measurementsStatus: RemoteDataState
}

@ErrorHandling
class MeasurementsTemplateBuilder extends PureComponent<
  TemplateBuilderProps,
  State
> {
  constructor(props) {
    super(props)

    const selectedDatabase = _.get(props, 'template.query.db', '')

    this.state = {
      databases: [],
      databasesStatus: RemoteDataState.Loading,
      selectedDatabase,
      measurementsStatus: RemoteDataState.Loading,
    }
  }

  public async componentDidMount() {
    await this.loadDatabases()
    await this.loadMeasurements()
  }

  public render() {
    const {template, onUpdateDefaultTemplateValue} = this.props
    const {
      databases,
      databasesStatus,
      selectedDatabase,
      measurementsStatus,
    } = this.state

    return (
      <>
        <div className="form-group col-xs-12">
          <label>Meta Query</label>
          <div className="temp-builder--mq-controls">
            <div className="temp-builder--mq-text">SHOW MEASUREMENTS ON</div>
            <DropdownLoadingPlaceholder rds={databasesStatus}>
              <Dropdown
                items={databases.map(text => ({text}))}
                onChoose={this.handleChooseDatabaseDropdown}
                selected={selectedDatabase}
                buttonSize="btn-sm"
                className="dropdown-stretch"
              />
            </DropdownLoadingPlaceholder>
          </div>
        </div>
        <TemplateMetaQueryPreview
          items={template.values}
          loadingStatus={measurementsStatus}
          onUpdateDefaultTemplateValue={onUpdateDefaultTemplateValue}
        />
      </>
    )
  }

  private async loadDatabases(): Promise<void> {
    const {source, me, isUsingAuth} = this.props

    this.setState({databasesStatus: RemoteDataState.Loading})

    try {
      const {data} = await showDatabases(source.links.proxy)
      const {databases} = parseShowDatabases(data)
      const {selectedDatabase} = this.state

      let roleDatabases: string[]

      if (databases && databases.length > 0) {
        if (isUserAuthorized(me.role, SUPERADMIN_ROLE) || !isUsingAuth) {
          roleDatabases = databases
        } else {
          roleDatabases = _.filter(
            databases,
            database => database === me.currentOrganization.name
          )
        }
      }

      this.setState({
        databases: roleDatabases,
        databasesStatus: RemoteDataState.Done,
      })

      if (!selectedDatabase) {
        this.handleChooseDatabase(_.get(roleDatabases, 0, ''))
      }
    } catch (error) {
      this.setState({databasesStatus: RemoteDataState.Error})
      console.error(error)
    }
  }

  private async loadMeasurements(): Promise<void> {
    const {template, source, onUpdateTemplate} = this.props
    const {selectedDatabase} = this.state

    this.setState({measurementsStatus: RemoteDataState.Loading})

    try {
      const {data} = await showMeasurements(
        source.links.proxy,
        selectedDatabase
      )
      const {measurementSets} = parseShowMeasurements(data)

      const measurements = _.get(measurementSets, '0.measurements', [])

      this.setState({measurementsStatus: RemoteDataState.Done})

      const nextValues = measurements.map(value => {
        return {
          type: TemplateValueType.Measurement,
          value,
          selected: false,
          localSelected: false,
        }
      })

      if (nextValues[0]) {
        nextValues[0].selected = true
      }

      onUpdateTemplate({...template, values: nextValues})
    } catch (error) {
      this.setState({measurementsStatus: RemoteDataState.Error})
      console.error(error)
    }
  }

  private handleChooseDatabaseDropdown = ({text}) => {
    this.handleChooseDatabase(text)
  }

  private handleChooseDatabase = (db: string): void => {
    this.setState({selectedDatabase: db}, () => this.loadMeasurements())

    const {template, onUpdateTemplate} = this.props

    onUpdateTemplate({
      ...template,
      query: {
        ...template.query,
        db,
      },
    })
  }
}

export default MeasurementsTemplateBuilder
