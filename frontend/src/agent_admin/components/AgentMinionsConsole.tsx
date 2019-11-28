// Libraries
import React, {PureComponent} from 'react'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

interface Props {
  res: string
}

class AgentMinionsConsole extends PureComponent<Props> {
  constructor(props) {
    super(props)
  }

  render() {
    const {res} = this.props
    return (
      <div className="panel">
        <div className="panel-heading">
          <h2 className="panel-title">Console</h2>
        </div>
        <div className="panel-body">
          <div className="console-zone">
            <FancyScrollbar>
              <pre className="console-zone--pre">{res}</pre>
            </FancyScrollbar>
          </div>
        </div>
      </div>
    )
  }
}

export default AgentMinionsConsole
