define(function(require){

    var base = require('utils/view/component'),
        off = require('off'),
        $ = require('jquery');

    /**
     * Header with additional information displayed when users clicks on [?] icon
     * @module InfoHeader
     */
    return off(function() {
        var header = base();
        header.$name('HeaderWithInfo');

        /**
         * @var {string} title - header text
         */
        header.title = off.property();

        /**
         * @var {string} info - text displayed as additional info
         */
        header.info  = off.property();

        /**
         * Dispatched when info box is opened
         * @event opened
         */
        header.opened = off.signal();

        header.init.override(function($super){
            $super();
            this._header = $('<h1></h1>');

            this._title = $('<span></span>');
            this._icon = $('<div class="info-icon"/>');
            this._info = $('<p class="info-content">');

            $(this._header).appendTo(this.parent);
            $(this._title).appendTo(this._header);
            $(this._icon).appendTo(this._header);
            $(this._info).appendTo(this.parent);

            this._info.hide();
            this._icon.click(function(){
                var duration = 200; // TODO: module.small ? 0 : 200;

                if (header._info.css('display') === 'none') {
                    header.opened(header.title());
                }

                header._info.toggle({
                    duration: duration,
                    easing: 'linear'
                });
            });
        });

        header.render = off(function() {
            this._title.html(this.title() + '&nbsp;');
            this._info.text(this.info());
        });

        header.flow(header.title, header.info).run(header.render);

        return header;
    });

});