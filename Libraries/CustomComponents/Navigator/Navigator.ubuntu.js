/**
 * @providesModule Navigator
 */
'use strict';

var Map = require('Map');
var React = require('React');
var PropTypes = React.PropTypes;
var LayoutPropTypes = require("LayoutPropTypes");
var StyleSheetPropType = require("StyleSheetPropType");

var requireNativeComponent = require('requireNativeComponent');
var findNodeHandle = require('findNodeHandle');

var {
  UbuntuNavigatorManager
} = require('NativeModules');

var View = require('View');

var Page = React.createClass({
  propTypes: {
    style: StyleSheetPropType(LayoutPropTypes),
    head: PropTypes.object,
    title: PropTypes.string,
    qmlAnchors: PropTypes.bool
  },

  render: function() {
    return (
        <UbuntuPage
          title={this.props.title}
          style={this.props.style}
          qmlAnchors={true}>
          {this.props.children}
        </UbuntuPage>
      );
  }
});

var UbuntuPage = requireNativeComponent('UbuntuPage', Page);


var Navigator = React.createClass({
  propTypes: {
    initialRoute: PropTypes.object,
    renderScene: PropTypes.func.isRequired,
  },

  getInitialState: function() {
    return { pageStack: [] };
  },

  componentWillMount: function() {
    this._navigator = null;
    this._pushPage = null;
    this._popPage = null;
    this._pages = [];
    this._pageRefs = [];
    this._routeMap = new Map();

    if (this.props.initialRoute) {
      this.push(this.props.initialRoute);
    }
  },

  componentDidMount: function() {
    if (this._pushPage == null)
      return;
    UbuntuNavigatorManager.push(findNodeHandle(this._navigator), findNodeHandle(this._pageRefs[this._pushPage]));
    this._pushPage = null;
  },

  componentDidUpdate: function() {
    console.log("=== componentDidUpdate: pushPage=" + this._pushPage);
    if (this._pushPage != null) {
      console.log("=== componentDidUpdate: will call push(" +
                  findNodeHandle(this._navigator) +", " +
                  findNodeHandle(this._pageRefs[this._pushPage]) + ")");
      UbuntuNavigatorManager.push(findNodeHandle(this._navigator), findNodeHandle(this._pageRefs[this._pushPage]));
      this._pushPage = null;
    }
    if (this._popPage != null) {
      console.log("=== componentDidUpdate: will call pop()");
      UbuntuNavigatorManager.pop(findNodeHandle(this._navigator));
      this._popPage = null;
    }
  },

  push: function(route) {
    var newPages = this.state.pageStack.concat([route]);
    this.setState({
        pageStack: newPages
      });
  },

  pop: function() {
    console.log("=== Navigator.pop()");
    var pageStack = this.state.pageStack;
    if (pageStack.length == 0)
      return;

    var route = pageStack[pageStack.length - 1];
    console.log("=== Navigator.pop(); delete route" + util.inspect(route));
    this._routeMap.delete(route);
    var newPages = pageStack.slice(0, -1);
    this._popPage = true;
    this.setState({
        pageStack: newPages
      });
  },

  render: function() {
    var pages = [];
    for (var i in this.state.pageStack) {
      var page = this.state.pageStack[i];
      if (this._routeMap.has(page)) {
        pages.push(this._routeMap.get(page));
      } else {
        var newPage = <Page
                        style={{flex: 1}}
                        ref={(page) => this._pageRefs[i] = page}
                        title={page.title || page.name}>
                        {this.props.renderScene(page, this)}
                      </Page>;
        this._routeMap.set(page, newPage);
        pages.push(newPage);
        this._pushPage = i;
      }
    }
    this._pages = pages;

    return (
      <UbuntuNavigator
        ref={(nav) => this._navigator = nav}
        style={this.props.style}>
        {this._pages}
      </UbuntuNavigator>
    );
  },
});

var UbuntuNavigator = requireNativeComponent('UbuntuNavigator', Navigator);

module.exports = Navigator;
