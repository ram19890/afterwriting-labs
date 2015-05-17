define(function(require){

    var layout = require('utils/layout'),
        EditorPlugin = require('views/plugins/editor');

    var module = {};

    module.init = function() {

        EditorPlugin.add(function(editor){});
        add_editor_to_layout();
    };

    function add_editor_to_layout() {
        var editor_plugin = EditorPlugin();
        layout.add_plugin(editor_plugin);
    }

    return module;

});