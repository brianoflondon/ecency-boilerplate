import React, {Component} from "react";

import {Modal} from "react-bootstrap";

import {ActiveUser} from "../../store/active-user/types";

import LinearProgress from "../linear-progress";
import PopoverConfirm from "../popover-confirm";
import Tooltip from "../tooltip";

import {getImages, deleteImage, UserImage} from "../../api/private";

import {success, error} from "../feedback";

import {_t} from "../../i18n";

import {deleteForeverSvg} from "../../img/svg";

import clipboard from "../../util/clipboard";

interface Props {
    activeUser: ActiveUser | null;
    onHide: () => void;
    onPick?: (url: string) => void;
}

interface State {
    loading: boolean,
    items: UserImage[]
}

export class Gallery extends Component<Props, State> {
    state: State = {
        loading: true,
        items: []
    }

    componentDidMount() {
        this.fetch();
    }

    fetch = () => {
        const {activeUser} = this.props;

        this.setState({loading: true});
        getImages(activeUser?.username!).then(items => {
            this.setState({items: this.sort(items), loading: false});
        }).catch(() => {
            this.setState({loading: false});
            error(_t('g.server-error'));
        })
    }

    sort = (items: UserImage[]) =>
        items.sort((a, b) => {
            return new Date(b.created).getTime() > new Date(a.created).getTime() ? 1 : -1;
        });

    itemClicked = (item: UserImage) => {
        const {onPick} = this.props;
        if (onPick) {
            onPick(item.url);
            return;
        }

        clipboard(item.url);
        success(_t('gallery.copied'));
    }

    delete = (item: UserImage) => {
        const {activeUser} = this.props;

        deleteImage(activeUser?.username!, item._id).then(() => {
            const {items} = this.state;
            const nItems = [...items].filter(x => x._id !== item._id);
            this.setState({items: this.sort(nItems)});
        }).catch(() => {
            error(_t('g.server-error'));
        })
    }

    render() {
        const {items, loading} = this.state;

        return <div className="dialog-content">
            {loading && <LinearProgress/>}
            {items.length > 0 && (
                <div className="gallery-list">
                    <div className="gallery-list-body">
                        {items.map(item => (
                            <div
                                className="gallery-list-item"
                                style={{backgroundImage: `url('${item.url}')`}}
                                key={item._id}>
                                <div className="item-inner"
                                     onClick={() => {
                                         this.itemClicked(item);
                                     }}/>
                                <div className="item-controls">
                                    <PopoverConfirm onConfirm={() => {
                                        this.delete(item);
                                    }}>
                                        <span className="btn-delete">
                                            <Tooltip content={_t("g.delete")}>{deleteForeverSvg}</Tooltip>
                                        </span>
                                    </PopoverConfirm>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {(!loading && items.length === 0) && (
                <div className="gallery-list">
                    {_t('g.empty-list')}
                </div>
            )}
        </div>
    }
}


export default class GalleryDialog extends Component<Props> {
    hide = () => {
        const {onHide} = this.props;
        onHide();
    }

    render() {
        return (
            <Modal show={true} centered={true} onHide={this.hide} size="lg" className="gallery-modal">
                <Modal.Header closeButton={true}>
                    <Modal.Title>{_t('gallery.title')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Gallery {...this.props}/>
                </Modal.Body>
            </Modal>
        );
    }
}