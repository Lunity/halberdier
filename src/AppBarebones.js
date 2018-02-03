import React from 'react';
import Reboot from 'material-ui/Reboot';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import DeleteIcon from 'material-ui-icons/Delete';
import SaveIcon from 'material-ui-icons/Save';
import RestoreIcon from 'material-ui-icons/Restore';
import { withStyles } from 'material-ui/styles';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
});

const {ipcRenderer} = require('electron');

class AppBarebones extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      masterPassword: '',
      isError: false,
      passwords: []
    };
    this.onChange = this.onChange.bind(this);
    this.reloadFromFile = this.reloadFromFile.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.addRow = this.addRow.bind(this);
    this.deleteRow = this.deleteRow.bind(this);
    this.onMasterPasswordInputChange = this.onMasterPasswordInputChange.bind(this);
  }

  componentWillMount() {
    ipcRenderer.on('passwords', (event, state) => {
      this.setState(state);
    });
  }

  onMasterPasswordInputChange(event) {
    this.setState({
      masterPassword: event.target.value
    });
  }

  onChange(index, fieldName) {
    return (event) => {
      const value = event.target.value;
      this.setState((prevState) => {
        const nextPasswords = prevState.passwords;
        nextPasswords[index][fieldName] = value;
        return {
          passwords: nextPasswords
        };
      })
    }
  }

  reloadFromFile(event) {
    event.preventDefault();
    ipcRenderer.send('get-passwords', this.state.masterPassword);
    this.setState({
      masterPassword: '',
    });
  }

  saveChanges() {
    const toSave = {
      passwords: this.state.passwords
    };
    ipcRenderer.send('save-changes', toSave);
  }

  addRow() {
    this.setState((prevState) => {
      return {
        passwords: [...prevState.passwords, {
          service: '',
          username: '',
          password: '',
        }],
      };
    })
  }

  deleteRow(index) {
    return () => {
      this.setState((prevState) => {
        const temp = prevState.passwords;
        temp.splice(index, 1)
        return {
          passwords: temp,
        };
      })
    }
  }

  render() {
    const { classes } = this.props;

    const rows = this.state.passwords.map((password, index) => {
      return (
        <tr key={index}>
          <td><input value={password.service} onChange={this.onChange(index, 'service')}></input></td>
          <td><input value={password.username} onChange={this.onChange(index, 'username')}></input></td>
          <td><input value={password.password} onChange={this.onChange(index, 'password')}></input></td>
          <td><IconButton onClick={this.deleteRow(index)}><DeleteIcon /></IconButton></td>
        </tr>
      );
    })

    return (
      <div>
        <Reboot />
        <form onSubmit={this.reloadFromFile}>
          <input
            type="password"
            placeholder="Enter password"
            onChange={this.onMasterPasswordInputChange}
            value={this.state.masterPassword}
          />
          <Button type="submit">Load from file</Button>
          {this.state.isError ? <span>Error</span> : null}
        </form>
        <table><tbody>
          {rows}
        </tbody></table>
        <Button raised onClick={this.reloadFromFile} className={classes.button}><RestoreIcon className={classes.leftIcon} />Reload from file</Button>
        <Button raised onClick={this.saveChanges} className={classes.button}><SaveIcon className={classes.leftIcon} />Save</Button>
        <Button raised onClick={this.addRow}>Add row</Button>
      </div>
    );
  }
}

export default withStyles(styles)(AppBarebones);
