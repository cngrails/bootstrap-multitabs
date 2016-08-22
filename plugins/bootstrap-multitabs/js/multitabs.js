//Make sure jQuery has been loaded
if (typeof jQuery === "undefined") {
    throw new Error("MultiTabs requires jQuery");
}((function($){
    //严格模式。
    "use strict";
    //声明变量、函数
    var NAMESPACE, tabIndex;   //常量&全局变量
    var MultiTabs,  handler, getTabIndex, toJoinerStr, toHumpStr,  isExtUrl, sumWidth, trimText, insertRule;  //函数
    var defaultLayoutTemplates, defaultLanguage, defaultAjaxTabPane, defaultIframeTabPane, defaultNavBar;  //默认参数

    NAMESPACE = '.multitabs';  // on() 绑定的事件的namespace

    /**
     * 组合on()事件的namespace，并绑定
     * @param $selector         jQuery选择器
     * @param event             事件
     * @param childSelector     子选择器，与on()用法一样，仅需要string
     * @param fn                函数
     * @param skipNS            是否跳过组合事件的namespace
     */
    handler = function ($selector, event, childSelector, fn, skipNS) {
        var ev = skipNS ? event : event.split(' ').join(NAMESPACE + ' ') + NAMESPACE;
        if ( typeof childSelector !== "string" ) {
            fn = fn || childSelector;
            childSelector = '';
        }
        $selector.off(ev, childSelector, fn).on(ev, childSelector, fn);
    };

    /**
     * 获取tab标签的index
     * @param content   content的类型。 main和editor仅能为一个
     * @param capacity  允许多少tab，main和editor不计在内
     * @returns index   返回tab index
     */
    getTabIndex = function(content, capacity){
        if(content === 'main' || content === 'editor') return 0;
        capacity = capacity || 8; //允许多少tab页面，超过则覆盖
        tabIndex = tabIndex || 0;
        tabIndex++;
        tabIndex = tabIndex % capacity;
        return tabIndex;
    };

    /**
     * 修剪text，去除所有多余的空格，并根据maxLength裁剪text，裁剪后加上省略号
     * @param text          需要修剪的text
     * @param maxLength     最大长度
     * @returns {string}    返回修剪好的text
     */
    trimText = function (text, maxLength){
        maxLength = maxLength || defaultNavBar.maxTitleLength;
        var words = String(text).split(' ');
        var t = '';
        for(var i=0; i<words.length; i++ ){
            var w =  $.trim(words[i]);
            t += w ? (w + ' ') : '';
        }

        if(t.length > maxLength) {
            t = t.substr(0, maxLength);
            t += '...'
        }
        return t;
    };

    /**
     * 计算总宽度
     * @param WidthObjList  需要计算宽度的列表
     * @returns {number}    返回总宽度（不含单位）
     */
    sumWidth = function (WidthObjList) {
        var width = 0;
        $(WidthObjList).each(function () {
            width += $(this).outerWidth(true)
        });
        return width
    };

    /**
     * 判断是否外部URL
     * @param url           需要判断的URL
     * @returns {boolean}   外部URL返回true，本地URL返回false
     */
    isExtUrl = function (url){
        var absUrl = (function(url){
            var a = document.createElement('a');
            a.href=url;
            return a.href;
        })(url);
        var webRoot = window.location.protocol + '//' + window.location.host + '/';
        var urlRoot = absUrl.substr(0, webRoot.length);
        return ( ! (urlRoot===webRoot) );
    };

    /**
     * 插入CSS样式
     *
     * 如下面这个样式表
     * .fixed .mt-nav-tools-right{
     *    position: fixed;
     *    right: 0;
     *    background-color : #fff;
     * }
     *
     * 需要这样插入样式表：
     * insertRule('.fixed .mt-nav-tools-right', 'position: fixed; right: 0; background-color : #fff;');
     *
     * @param selectorText      选择器文本
     * @param cssText           css样式文本
     * @param position          插入的位置，默认为0；
     */
    insertRule = function (selectorText, cssText, position) {
        var sheet = document.styleSheets[0];
        position = position || 0;
        if (sheet.insertRule) {
            sheet.insertRule(selectorText + "{" + cssText + "}", position);
        } else if (sheet.addRule) {
            sheet.addRule(selectorText, cssText, position);
        }
    };




    /**
     * 将驼峰式string 转化为带'-'连接符的字符串
     */
    toJoinerStr = function(humpStr){
        return humpStr.replace(/\./g, '').replace(/([A-Z])/g, "-$1").toLowerCase();
    };

    /**
     * 将带'-'连接符的string 转化为驼峰式
     */
    toHumpStr = function(joinerStr){
        return joinerStr.replace(/\./g, '').replace(/\-(\w)/g, function(x){return x.slice(1).toUpperCase();});
    };



    /**
     * Layout Templates
     */
    defaultLayoutTemplates = {
        /**
         * Main Layout
         */
        main : '<div class="mt-wrapper {mainClass}" style="height: 100%;" >' +
        '   <div class="mt-nav-bar" style="background-color : {backgroundColor};">' +
        '       <div class="mt-nav-tools-left">' +
        '           <ul  class="nav nav-tabs">' +
        '               <li class="mt-move-left"><a><i class="fa fa-backward"></i></a></li>' +
        '           </ul>' +
        '       </div>' +
        '       <nav class="mt-nav-panel">' +
        '           <ul  class="nav nav-tabs">' +
        '				<li><a href="#welcome_to_use_multitabs"  data-content="main" data-index="0" data-id="welcome_to_use_multitabs"> Home </a></li>' +
        '           </ul>' +
        '       </nav>' +
        '       <div class="mt-nav-tools-right" style="background-color : {backgroundColor};">' +
        '           <ul  class="nav nav-tabs">' +
        '               <li class="mt-move-right"><a><i class="fa fa-forward"></i></a></li>' +
        '               <li class="mt-dropdown-option dropdown">' +
        '                   <a href="#"  class="dropdown-toggle" data-toggle="dropdown">{option}<span class="caret"></span></a>' +
        '                   <ul role="menu" class="dropdown-menu dropdown-menu-right">' +
        '                       <li class="mt-show-actived-tab"><a>{showActivedTab}</a></li>' +
        '                       <li class="divider"></li>' +
        '                       <li class="mt-close-all-tabs"><a>{closeAllTabs}</a></li>' +
        '                       <li class="mt-close-other-tabs"><a>{closeOtherTabs}</a></li>' +
        '                   </ul>' +
        '               </li>' +
        '           </ul>' +
        '       </div>' +
        '   </div>' +
        '   <div class="tab-content mt-tab-content" >' +
        '		<div class="tab-pane active"  data-content="main" data-index="0" data-id="welcome_to_use_multitabs"><h1>Demo page</h1><h2>Welcome to use bootstrap multi-tabs :) </h2></div>' +
        '	</div>' +
        '</div>',
        tab : '<a href="{href}"  data-content="{content}" data-index="{index}" data-id="{did}">{title}{closeBtn}</a>',
        closeBtn : ' <i class="fa fa-times"></i>',
        ajaxTabPane : '<div class="tab-pane {class}"  data-content="{content}" data-index="{index}" data-id="{did}"></div>',
        iframeTabPane : '<iframe class="tab-pane {class}"  width="100%" height="100%" frameborder="0" src="" data-content="{content}" data-index="{index}" data-id="{did}" seamless></iframe>',
    };

    /**
     * 默认的语言为英语
     */
    defaultLanguage = {
        navBar : {
            title : 'Tab',                                  //默认的标签页名称
            option : 'Option',                              //标签栏的下拉菜单名称
            showActivedTab : 'Show Activated Tab',          //下拉菜单的显示激活页面
            closeAllTabs : 'Close All Tabs',                //下拉菜单的关闭所有页面
            closeOtherTabs : 'Close Other Tabs',            //下拉菜单的关闭其他页面
        },
        editorUnsave: {
            colse : 'Your data is not save, are you sure to lose it?',   //关闭未保存editor标签页的警示
            cover : 'Can not cover Editor without saving the old one!'   //覆盖未保存editor标签页的警示
        }
    };

    /**
     * 默认的标签头选项
     */
    defaultNavBar = {
        class : '',                 //class，默认为空，可以自行添加
        maxTabs : 8,                //默认可容纳标签数为8
        maxTitleLength : 25,     //默认最长tab tittle为25
    };

    /**
     * 默认的ajax tab-pane 选项
     */
    defaultAjaxTabPane = {
        class : '',                 //class，默认为空，可自行添加
    };

    /**
     *默认的iframe tab-pane 选项
     */
    defaultIframeTabPane = {
        class : '',                 //class，默认为空，可自行添加
        otherHeight : 0             //其他高度，iframe需要剔除的高度，如footer
    };

    /**
     * multitabs的主函数
     * @param element       主容器
     * @param options       选项
     * @constructor
     */
    MultiTabs = function (element, options) {
        var self = this;
        self.$element = $(element);
        if (!self._validate()) {
            return;
        }
        self._init(options);
        self._listen();
        self._finish();
    };

    /**
     * MultiTabs的函数。
     * 至于用prototype的原因如下
     * 不加.prototype的话, 每一个对象都会拥有该方法的一份拷贝,造成内存浪费,加上.prototype可以保证所有实例对象共享一份方法
     */
    MultiTabs.prototype = {
        /**
         * 构造函数
         */
        constructor: MultiTabs,

        /**
         * 初始化函数
         * @param options
         * @private
         */
        _init: function (options) {
            var self = this, $el = self.$element
            $el.html(options.layoutTemplates.main
                .replace('{mainClass}', toJoinerStr(options.class))
                .replace(/\{backgroundColor\}/g, options.navBar.backgroundColor)
                .replace('{option}' , options.language.navBar.option)
                .replace('{showActivedTab}' , options.language.navBar.showActivedTab)
                .replace('{closeAllTabs}' , options.language.navBar.closeAllTabs)
                .replace('{closeOtherTabs}' , options.language.navBar.closeOtherTabs)
            );
            $el.navBar = $el.find('.mt-nav-bar:first');
            $el.navToolsLeft = $el.navBar.find('.mt-nav-tools-left:first ul');
            $el.navPanel = $el.navBar.find('.mt-nav-panel:first ul');
            $el.navToolsRight = $el.navBar.find('.mt-nav-tools-right:first ul');
            $el.tabContent = $el.find('.tab-content:first');
            //hide tab-header if maxTabs less than 1
            if(options.navBar.maxTabs <= 1){
                options.navBar.maxTabs = 1;
                $el.navBar.hide();
            };
            //set the nav-panel width
            var toolWidth = $el.navBar.find('.mt-nav-tools-left:visible:first').outerWidth(true) + $el.navBar.find('.mt-nav-tools-right:visible:first').outerWidth(true);
            $el.navPanel.parent('.mt-nav-panel').css('width', 'calc(100% - ' + toolWidth + 'px)');
            if(options.fixed){
                $el.addClass('mt-fixed');
                self._fixedTabHeader();
            }
            var otherHeight = parseInt(options.iframeTabPane.otherHeight);
            $el.tabContent.css('height', 'calc(100% - ' + otherHeight + 'px)');
            self.options = options;
        },

        /**
         * 初始化完成后运行的函数
         * @returns {boolean}
         * @private
         */
        _finish : function(){
            var self = this, $el = self.$element, options = self.options, init = options.init;
            if(Array(init).length){
                $.each(init, function(key, param){
                    if(!param.url) return false;
                    param.url = decodeURIComponent(param.url.replace('#', ''));
                    if (!$.trim(param.url).length) return false;
                    param.iframe = param.iframe || isExtUrl(param.url) || options.iframe;
                    if(param.iframe || !param.content) param.content = options.content;
                    param.title = param.title || param.url.replace('http://', '').replace('https://', '') || options.language.navBar.title;
                    param.title = trimText(param.title, options.navBar.maxTitleLength);
                    self._create(param);
                });
            };
            //没有任何标签激活的，就激活首页。
            if(!$el.navPanel.find('li.active').length && !window.location.hash.substr(1)) self._active($el.navPanel.find('[data-content="main"]:first').parent('li'));
        },

        /**
         * 有效性检查函数
         * @returns {boolean}
         * @private
         */
        _validate: function () {
            var self = this, $exception;
            if (self.$element.length === 1) {
                return true;
            }
            $exception = '<div class="help-block alert alert-warning">' +
                '<h4>Duplicate Instance</h4>' +
                'MultiTabs only can be 1 Instance.' +
                '</div>';
            self.$element.after($exception);
            return false;
        },

        /**
         * 监听、绑定事件。
         * @private
         */
        _listen: function () {
            var self = this, $el = self.$element, options = self.options;
            //create tab
            handler($(document), 'click', options.link, function(){
                event.preventDefault();
                var param = self._check(this);
                if(param) {
                    var $tab = self._create(param);
                };
                if($tab) self._active($tab);
                return false;
            });
            //active tab
            handler($(document), 'click', '.mt-nav-panel a', function(){
                event.preventDefault();
                self._active($(this).parents('li:first'));
            });
            //close tab
            handler($(document), 'click', '.mt-nav-panel a i', function(){
                event.preventDefault();
                self._close($(this).parents('li:first'));
                return false;
            });
            //move left
            handler($el.navToolsLeft.find('.mt-move-left:first'), 'click', function(){
                event.preventDefault();
                self._moveLeft();
            });
            //move right
            handler($el.navToolsRight.find('.mt-move-right:first'), 'click', function(){
                event.preventDefault();
                self._moveRight();
            });
            //show actived tab
            handler($el.navToolsRight.find('.mt-show-actived-tab:first'), 'click', function(){
                event.preventDefault();
                self._showActive();
            });
            //close all tabs
            handler($el.navToolsRight.find('.mt-close-all-tabs:first'), 'click', function(){
                event.preventDefault();
                self._closeAll();
            });
            //close other tabs
            handler($el.navToolsRight.find('.mt-close-other-tabs:first'), 'click', function(){
                event.preventDefault();
                self._closeOthers();
            });
            //close window warning.
            handler($(window), 'beforeunload',function(){
                if($el.tabContent.find('.tab-pane[data-content="editor"]').hasClass('unsave')){
                    return options.language.editorUnsave.close;
                }
            });
            //if show hash， bind hash change
            if(options.showHash){
                handler($(window), 'hashchange load', function(){
                    event.preventDefault();
                    var hash = window.location.hash;
                    if(!hash) return false;
                    var url = hash.replace('#','');
                    var $tabA = $el.navPanel.find('[data-id="'+ url +'"]:first');
                    if($tabA.length){
                        return false;
                    }else{
                        var a = document.createElement('a');
                        a.href=url;
                        var param = self._check(a);
                        if(param) {
                            var $tab = self._create(param);
                        };
                        if($tab) self._active($tab);
                    }
                });
            };
        },

        /**
         * 获取触发multitabs的对象的参数。
         * @param obj          触发multitabs的对象
         * @returns param      返回条件
         * @private
         */
        _getParam : function(obj){
            var self = this, $el = self.$element, options = self.options, param;
            param = $(obj).data() || {};
            param.url = param.url || $(obj).attr('href');
            param.url = decodeURIComponent(param.url.replace('#', ''));
            if (!$.trim(param.url).length) return false;
            param.iframe = param.iframe || isExtUrl(param.url) || options.iframe;
            if(param.iframe || !param.content) param.content = options.content;
            param.title = param.title || $(obj).text() || param.url.replace('http://', '').replace('https://', '') || options.language.navBar.title;
            param.title = trimText(param.title, options.navBar.maxTitleLength);
            return param;
        },

        /**
         * 检查触发multitabs的对象是否有效，并尝试激活tab，如果激活不成功，返回param。
         * @param obj
         * @returns {*}
         * @private
         */
        _check : function (obj) {
            var self = this, $el = self.$element, options = self.options;
            var param, tab;
            param = self._getParam(obj);
            if(!param) return false;
            tab = $el.navPanel.find('a[data-id="'+ param.url +'"][data-content="'+ param.content +'"]').parent('li');
            if ( ! self._active(tab)  ) return param;  //如果无法激活tab，则返回param。
            return false
        },

        _getTabPane : function(tab){
            var self = this, $el = self.$element, $tabA = $(tab).children('a:first'), url = $tabA.attr('href').replace('#',''), content = $tabA.attr('data-content');
            return $el.tabContent.find('.tab-pane[data-content="'+ content +'"][data-id="'+ url +'"]:first');
        },

        /**
         * 根据param创建tab，并返回tab
         * @param param     创建tab的参数
         * @returns tab     返回创建好的tab对象
         */
        _create : function (param) {
            var self = this,
                options = self.options,
                $el = self.$element,
                $editor = $el.tabContent.find('.tab-pane[data-content="editor"]');
            var tabHtml, closeBtnHtml, tabPaneHtml, iframe, index;
            //禁止打开多个edit页面，如果edit页面存在，也禁止覆盖
            if(param.content === 'editor' && $editor.length && $editor.hasClass('unsave')){
                var $tab = $el.navPanel.find('a[data-content="editor"]').parent('li');
                self._active($tab);
                var $tabPane = self._getTabPane($tab);
                $tabPane.before('<div class="help-block alert alert-warning">' + options.language.editorUnsave.cover + '</div>');
                return false;
            }
            index = getTabIndex(param.content, options.navBar.maxTabs);
            //get layoutTemplates
            closeBtnHtml = (param.content === 'main') ? '' : options.layoutTemplates.closeBtn; //main content can not colse.
            tabHtml = options.layoutTemplates.tab.replace('{href}', '#'+ param.url)
                .replace('{content}', param.content)
                .replace('{index}',index)
                .replace('{did}', param.url)
                .replace('{title}', param.title)
                .replace('{closeBtn}', closeBtnHtml);
            //tab create
            var $tab = $el.navPanel.find('a[data-content="'+ param.content +'"][data-index="'+ index +'"]').parent('li');
            if($tab.length){
                $tab.html(tabHtml);
            }else $el.navPanel.append( '<li>' + tabHtml + '</li>');
            $tab = $el.navPanel.find('a[data-content="'+ param.content +'"][data-index="'+ index +'"]').closest('li');
            //tab-pane create
            iframe = param.iframe === undefined ? options.iframe : param.iframe;
            if(iframe){
                tabPaneHtml = options.layoutTemplates.iframeTabPane.replace('{class}', options.iframeTabPane.class);
            }else{
                tabPaneHtml = options.layoutTemplates.ajaxTabPane.replace('{class}', options.ajaxTabPane.class);
            }
            tabPaneHtml = tabPaneHtml
                .replace('{content}', param.content)
                .replace('{index}',index)
                .replace('{did}', param.url);
            // $el.tabContent.children().removeClass('active');
            $el.tabContent.find('.tab-pane[data-content="'+ param.content +'"][data-index="'+index+'"]').remove();//直接移除旧的content，不应重复判断是否同内容。
            $el.tabContent.append(tabPaneHtml);
            return $tab;
        },

        /**
         * 修正tab的位置。
         * @param tab
         * @private
         */
        _fixTabPosition : function (tab) {
            var self = this, $el = self.$element;
            var tabWidth = $(tab).outerWidth(true);
            var tabNextWidth = $(tab).next().outerWidth(true);
            var tabPrevWidth = $(tab).prev().outerWidth(true);
            var tabMarginLeft = sumWidth($(tab).prevAll());
            var tabMarginRight = sumWidth($(tab).nextAll());
            var navPanelWidth = $el.navPanel.outerWidth(true);
            var totalTabsWidth = sumWidth($el.navPanel.find('li'));
            var px = 0;
            if (totalTabsWidth < navPanelWidth) {
                px = 0
            } else {
                if (tabMarginRight <= (navPanelWidth - tabWidth - tabNextWidth)) {
                    if ((navPanelWidth - tabNextWidth) > tabMarginRight) {
                        px = tabMarginLeft;
                        var _tab = tab;
                        while ((px - $(_tab).outerWidth()) > (totalTabsWidth - navPanelWidth)) {
                            px -= $(_tab).prev().outerWidth();
                            _tab = $(_tab).prev()
                        }
                    }
                } else {
                    if (tabMarginLeft > (navPanelWidth - tabWidth - tabPrevWidth)) {
                        px = tabMarginLeft - tabPrevWidth
                    }
                }
            }
            $el.navPanel.animate({
                marginLeft : 0 - px + "px"
            }, "fast");
        },

        /**
         * 向左边移动
         * @returns {boolean}
         * @private
         */
        _moveLeft : function () {
            var self = this, $el = self.$element;
            var navPanelMarginLeft = Math.abs(parseInt($el.navPanel.css("margin-left")));
            var navPanelWidth = $el.navPanel.outerWidth(true);
            var totalTabsWidth = sumWidth($el.navPanel.find('li'));
            var px = 0;
            if (totalTabsWidth < navPanelWidth) {
                return false
            } else {
                var _tab = $el.navPanel.find('li:first');
                var marginLeft = 0;
                while ((marginLeft + _tab.width()) <= navPanelMarginLeft) {
                    marginLeft += _tab.outerWidth(true);
                    _tab = $(_tab).next()
                }
                marginLeft = 0;
                if (sumWidth($(_tab).prevAll()) > navPanelWidth) {
                    while (( (marginLeft + _tab.width()) < navPanelWidth) && _tab.length > 0) {
                        marginLeft += _tab.outerWidth(true);
                        _tab = $(_tab).prev()
                    }
                    px = sumWidth($(_tab).prevAll())
                }
            }
            $el.navPanel.animate({
                marginLeft : 0 - px + "px"
            }, "fast")
        },
        /**
         * 向右边移动
         * @returns {boolean}
         * @private
         */
        _moveRight : function () {
            var self = this, $el = self.$element;
            var navPanelMarginLeft = Math.abs(parseInt($el.navPanel.css("margin-left")));
            var navPanelWidth = $el.navPanel.outerWidth(true);
            var totalTabsWidth = sumWidth($el.navPanel.find('li'));
            var px = 0;
            if (totalTabsWidth < navPanelWidth) {
                return false;
            } else {
                var _tab = $el.navPanel.find('li:first');
                var marginLeft = 0;
                while ((marginLeft + _tab.width()) <= navPanelMarginLeft) {
                    marginLeft += _tab.outerWidth(true);
                    _tab = $(_tab).next()
                }
                marginLeft = 0;
                while (( (marginLeft + _tab.width()) < navPanelWidth) && _tab.length > 0) {
                    marginLeft += _tab.outerWidth(true);
                    _tab = $(_tab).next()
                }
                px = sumWidth($(_tab).prevAll());
                if (px > 0) {
                    $el.navPanel.animate({
                        marginLeft : 0 - px + "px"
                    }, "fast")
                }
            }
        },

        /**
         * 关闭tab
         * @param tab
         * @returns {boolean}
         */
        _close: function (tab) {
            var self = this, $el = self.$element, $tab = $(tab), $tabPane = self._getTabPane($tab);
            if($tab.length && $tabPane.length){
                if($tabPane.attr('data-content') === 'editor' && $tabPane.hasClass('unsave')){
                    if(!self._unsaveConfirm()) return false;
                }
            }
            if ($tab.hasClass("active")) {
                if ($tab.next("li").size()) {
                    self._active($tab.next("li:first"));
                }else if ($tab.prev("li").size()) {
                    self._active($tab.prev("li:last"));
                }
            }
            $tab.remove();
            $tabPane.remove();
        },

        /**
         * 关闭其他的tab
         * @private
         */
        _closeOthers : function () {
            var self = this, $el = self.$element;
            $el.navPanel.find('li:not(.active)').find('a:not([data-content="main"]):not([data-content="editor"])').each(function () {
                var $tabA = $(this);
                var url = $tabA.attr('href').replace('#','');
                var content = $tabA.attr('data-content');
                $el.tabContent.find('.tab-pane[data-content="'+ content +'"][data-id="'+ url +'"]:first').remove();
                $tabA.parent('li').remove()
            });
            $el.navPanel.css("margin-left", "0");
        },

        /**
         * 定位并显示激活的tab
         * @private
         */
        _showActive : function () {
            var self = this, $el = self.$element;
            var tab = $el.navPanel.find('li.active:first');
            self._fixTabPosition(tab);
        },

        /**
         * 关闭所有（main和editor除外）
         * @private
         */
        _closeAll : function(){
            var self = this, $el = self.$element;
            $el.navPanel.find('a:not([data-content="main"]):not([data-content="editor"])').each(function(){
                var $tabA = $(this);
                var $tab = $tabA.parent('li');
                var url = $tabA.attr('href').replace('#','');
                var content = $tabA.attr('data-content');
                $el.tabContent.find('.tab-pane[data-content="'+ content +'"][data-id="'+ url +'"]:first').remove(); //remove tab-content
                $tab.remove();  //remove
            });
            self._active($el.navPanel.find('a[data-content="main"]:first').parent('li'));
        },

        /**
         * 激活tab
         * @param tab
         * @returns {boolean}
         */
        _active : function (tab) {
            var self = this, $el = self.$element, options = self.options;
            var $tab = $(tab);
            if(!$tab.length) return false;
            var tabA = $tab.find('a:first'),
                url = tabA.attr('href').replace('#',''),
                content = tabA.attr('data-content'),
                $tabPane = self._getTabPane($tab);
            if(!$tabPane.length) return false;
            $tab.addClass('active').siblings().removeClass('active');
            self._fixTabPosition($tab);
            $tabPane.addClass('active').siblings().removeClass('active');
            self._fixTabContentLayout($tabPane);
            if(options.showHash && url) window.location.hash = '#' + url;
            //如果tab-pane为空，则加载内容
            if(!$tabPane.html()){
                if(!$tabPane.is('iframe')){
                    $tabPane.load(url);
                } else {
                    if(!$tabPane.attr('src')){
                        // setTimeout(function(){
                        //     $tabPane.attr('src', url);
                        // }, 500);
                        $tabPane.attr('src', url);
                    }
                }

            };
            return $tab;
        },

        /**
         * 固定tab标签头
         * @private
         */
        _fixedTabHeader : function(){
            var self = this, $el = self.$element;
            var position = $el.position();
            // var left = position.left + parseInt($el.css('marginLeft').replace('px','')) + parseInt($el.css('borderLeft').replace('px','')) + parseInt($el.css('paddingLeft').replace('px',''));
            var top = position.top + parseInt($el.css('marginTop').replace('px','')) + parseInt($el.css('borderTop').replace('px','')) + parseInt($el.css('paddingTop').replace('px',''));
            var right = $(window).width() - position.left - $el.outerWidth(true);
            var navBarHeight = $el.navBar.outerHeight(true);
            var paddingTop =  parseInt($el.tabContent.css('paddingTop'));
            insertRule('.mt-fixed .mt-nav-bar', 'position : fixed; top : ' + top + 'px; left : auto;');
            insertRule('.mt-fixed .mt-nav-tools-right', 'position : fixed; top : ' + top + 'px; right : ' + right + 'px;');
            insertRule('.mt-fixed .mt-tab-content', 'padding-top : ' + paddingTop + navBarHeight + 'px;');
        },

        /**
         * 判断tab-pane是否iframe，并根据状态添加/删除对应的class
         * @param tabPane
         * @private
         */
        _fixTabContentLayout : function(tabPane){
            var self = this, $el = self.$element, options = self.options;
            var $tabPane = $(tabPane);
            if($tabPane.is('iframe')){
                $el.removeClass('mt-fixed');
                $('body').addClass('full-height-layout');
            }else{
                if(options.fixed) $el.addClass('mt-fixed');
                $('body').removeClass('full-height-layout');
            }
        },

        /**
         * editor未保存的确认
         * @private
         */
        _unsaveConfirm : function(){
            var self = this, options = self.options;
            return confirm(options.language.editorUnsave.close);
        }
    };

    /**
     * 入口函数
     * @param option
     */
    $.fn.multitabs = function(option){
        var args = Array.apply(null, arguments), retvals = [];
        args.shift();

        $(this).each(function () {
            var self = $(this), data = self.data('multitabs'), options = typeof option === 'object' && option,
                opts;

            if (!data) {
                opts = $.extend(true, {}, $.fn.multitabs.defaults, options, self.data());
                data = new MultiTabs(this, opts);
                self.data('multitabs', data);
            }
            if (typeof option === 'string') {
                retvals.push(data[option].apply(data, args));
            }
        });
        switch (retvals.length) {
            case 0:
                return this;
            case 1:
                return retvals[0];
            default:
                return retvals;
        }
    };

    /**
     * Default Options
     * @type {{showHash: boolean, mode: string, maxTabs: number, maxTitleLength: number, tabTitle: string, content: string}}
     */
    $.fn.multitabs.defaults = {
        init :[],
        fixed : true,
        backgroundColor: '#fff',
        showHash : true,
        content : 'info',
        link : '.multi-tabs',
        class : '',
        iframe : false,                     //iframe mode, default is false, just use iframe for external link
        navBar : defaultNavBar,
        ajaxTabPane : defaultAjaxTabPane,
        iframeTabPane : defaultIframeTabPane,
        layoutTemplates : defaultLayoutTemplates,
        language : defaultLanguage,
    };

})(jQuery));