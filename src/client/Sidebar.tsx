import React from 'react'
import { Socket, EventMap } from '@ws/client'
import { Drawer, Divider, WithStyles, createStyles, withStyles } from '@material-ui/core';
import { Theme } from '@material-ui/core/styles';

const drawerWidth = 300;

const styles = (theme: Theme) => createStyles({
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
        justifyContent: 'flex-start',
    },
});

interface Props extends WithStyles<typeof styles> {
    ws: Socket
}

type State = {
    messages:  EventMap['Message'][0][]
}

const Sidebar = withStyles(styles)(
    class Sidebar extends React.Component<Props, State> {

        constructor(props: Props) {
            super(props);
            this.state = {
                messages: []
            };
        }

        handlePlay() {
            VILOS_PLAYER.play()
        }

        handleMessage(message: EventMap['Message'][0]) {
            this.setState({ messages: [...this.state.messages, message]})
        }

        componentDidMount() {
            this.props.ws.on('Message', this.handleMessage)
            this.props.ws.on('Play', this.handlePlay)
        }

        componentWillUnmount() {
            this.props.ws.off('Message', this.handleMessage)
        }

        render() {
            return (
                <Drawer
                    className={this.props.classes.drawer}
                    classes={{
                        paper: this.props.classes.drawerPaper,
                    }}
                    variant="permanent"
                    anchor="right"
                >
                    <div className={this.props.classes.drawerHeader}>
                        Heading
                    </div>
                    <Divider />
                    {this.state.messages.map(m => <span key={m.ID}>{JSON.stringify(m)}</span>)}
                </Drawer>
            );
        }
    }
)

export default Sidebar