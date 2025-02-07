import React, {Component} from "react";

import {connect} from "react-redux";

import { Redirect } from "react-router-dom";

import { ListStyle } from "../store/global/types";

import { makeGroupKey } from "../store/entries";

import Meta from "../components/meta";
import Theme from "../components/theme";
import Feedback from "../components/feedback";
import NavBar from "../components/navbar";
import NavBarElectron from "../../desktop/app/components/navbar";
import EntryIndexMenu from "../components/entry-index-menu";
import LinearProgress from "../components/linear-progress";
import EntryListLoadingItem from "../components/entry-list-loading-item";
import DetectBottom from "../components/detect-bottom";
import EntryListContent from "../components/entry-list";
import TrendingTagsCard from "../components/trending-tags-card";
import ScrollToTop from "../components/scroll-to-top";
import MarketData from "../components/market-data";
import LandingPage from "../components/landing-page";

import { _t } from "../i18n";

import _c from "../util/fix-class-names";

import capitalize from "../util/capitalize";

import defaults from "../constants/defaults.json";

import {
  pageMapDispatchToProps,
  pageMapStateToProps,
  PageProps,
} from "./common";
import { setupConfig } from "../../setup";

interface State {
  step: number;
  community: string;
}

class EntryIndexPage extends Component<PageProps, State> {
  state: State = {
    step: 1,
    community: "",
  };

  componentDidMount() {
    const { global, fetchEntries, fetchTrendingTags } = this.props;
    fetchEntries(global.filter, global.tag, false);
    fetchTrendingTags();

    const community = setupConfig.communityId;

    if (community) {
      this.setState({ ...this.state, community });
    }

    this.props.activeUser !== null
      ? this.changeStepTwo()
      : this.changeStepOne();
  }

  componentDidUpdate(prevProps: Readonly<PageProps>): void {
    const { global, fetchEntries, activeUser } = this.props;
    const { global: pGlobal, activeUser: pActiveUser } = prevProps;

    // page changed.
    if (!global.filter) {
      return;
    }

    if (!(global.filter === pGlobal.filter && global.tag === pGlobal.tag)) {
      fetchEntries(global.filter, global.tag, false);
    } else if (pActiveUser?.username !== activeUser?.username) {
      this.reload();
    }
  }

  bottomReached = () => {
    const { global, entries, fetchEntries } = this.props;
    const { step } = this.state;
    const { filter, tag } = global;
    const groupKey = makeGroupKey(filter, tag);

    const data = entries[groupKey];
    const { loading, hasMore } = data;

    if (!loading && hasMore && step === 2) {
      fetchEntries(filter, tag, true);
    }
  };

  reload = () => {
    const { global, fetchEntries, invalidateEntries } = this.props;
    invalidateEntries(makeGroupKey(global.filter, global.tag));
    fetchEntries(global.filter, global.tag, false);
  };

  changeStepOne = () => {
    this.setState({
      step: 1,
    });
  };

  changeStepTwo = () => {
    this.setState({
      step: 2,
    });
  };

  render() {
    const { global, activeUser, entries, location } = this.props;
    const { filter, tag } = global;

    const groupKey = makeGroupKey(filter, tag);

    const data = entries[groupKey];
    if (data === undefined) {
      return null;
    }

    const entryList = data.entries;
    const loading = data.loading;

    //  Meta config
    const fC = capitalize(filter);
    let title = _t("entry-index.title", { f: fC });
    let description = _t("entry-index.description", { f: fC });
    let url = `/${filter}`;
    let canonical = `${defaults.base}/${filter}`;
    let rss = "";

    if (tag) {
      if (activeUser && tag === "my") {
        title = `@${activeUser.username}'s community feed on decentralized web`;
        description = _t("entry-index.description-user-feed", { u: tag });
        canonical = `${defaults.base}/@${tag}/${filter}`;
      } else if (tag.startsWith("@")) {
        title = `${tag}'s ${filter} on decentralized web`;
        description = _t("entry-index.description-user-feed", { u: tag });
        canonical = `${defaults.base}/@${tag}/${filter}`;
      } else {
        title = `latest #${tag} ${filter} topics on internet`;
        description = _t("entry-index.description-tag", { f: fC, t: tag });

        url = `/${filter}/${tag}`;
        canonical = `${defaults.base}/${filter}/${tag}`;
        rss = `${defaults.base}/${filter}/${tag}/rss.xml`;
      }
    }

    const metaProps = { title, description, url, canonical, rss };

    const promoted = entries["__promoted__"].entries;

    const showEntryPage =
      this.state.step === 2 ||
      // || activeUser !== null || activeUser === null
      location?.pathname?.startsWith("/hot") ||
      location?.pathname?.startsWith("/created") ||
      location?.pathname?.startsWith("/trending") ||
      location?.pathname?.startsWith("/payout") ||
      location?.pathname?.startsWith("/payout_comments");
    let containerClasses = global.isElectron
      ? "app-content entry-index-page mt-0 pt-6"
      : "app-content entry-index-page";

    return (
      <>
        {!!this.state.community && (
          <Redirect to={`/created/${this.state.community}`} />
        )}
        <Meta {...metaProps} />
        <ScrollToTop />
        <Theme global={this.props.global} />
        <Feedback />
        {global.isElectron
          ? NavBarElectron({
              ...this.props,
              reloadFn: this.reload,
              reloading: loading,
              step: this.state.step,
              setStepTwo: this.changeStepTwo,
            })
          : NavBar({
              ...this.props,
              step: this.state.step,
              setStepOne: this.changeStepOne,
              setStepTwo: this.changeStepTwo,
            })}
        {this.state.step === 1 &&
          activeUser === null &&
          location &&
          "/" === location?.pathname && (
            <LandingPage {...this.props} changeState={this.changeStepTwo} />
          )}
        {showEntryPage && (
          <div className={containerClasses}>
            <div className="tags-side">
              {!global.isMobile && <>{TrendingTagsCard({ ...this.props })}</>}
            </div>
            <div
              className={_c(`entry-page-content ${loading ? "loading" : ""}`)}
            >
              <div className="page-tools">
                {EntryIndexMenu({ ...this.props })}
              </div>
              {loading && entryList.length === 0 ? <LinearProgress /> : ""}
              <div className={_c(`entry-list ${loading ? "loading" : ""}`)}>
                <div
                  className={_c(
                    `entry-list-body limited-area ${
                      global.listStyle === ListStyle.grid ? "grid-view" : ""
                    }`
                  )}
                >
                  {loading && entryList.length === 0 && (
                    <EntryListLoadingItem />
                  )}
                  {EntryListContent({
                    ...this.props,
                    entries: entryList,
                    promotedEntries: promoted,
                    loading,
                  })}
                </div>
              </div>
              {loading && entryList.length > 0 ? <LinearProgress /> : ""}
            </div>
            <div className="side-menu">
              {!global.isMobile && (
                <>{1 !== this.state.step && <MarketData global={global} />}</>
              )}
            </div>
          </div>
        )}
        <DetectBottom onBottom={this.bottomReached} />
      </>
    );
  }
}


export default connect(pageMapStateToProps, pageMapDispatchToProps)(EntryIndexPage);
