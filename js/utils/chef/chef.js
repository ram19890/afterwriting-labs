define(function(require) {

    var Protoplast = require('p');

    var Chef = Protoplast.extend({

        $create: function() {
            this.names = [];
            this.recipes = [];
            this.operators = {};
            this.cache = {};
            this.cache_hierarchy = {};
            this._rnd = 0;
        },

        next_name: function() {
            return '__' + (this._rnd++) + '___';
        },

        add: function(name, recipe) {

            var index;

            if (index = this.recipes.indexOf(recipe) === -1) {
                this.recipes.push(recipe);
                this.names.push(name);

                var operator = recipe.create(name);

                for (var property_name in recipe.$meta.properties.type) {
                    var type = recipe.$meta.properties.type[property_name];
                    this.inject_type(operator, property_name, type);
                }

                this.operators[name] = operator;
            }
            else {
                var existing_name = this.names[index];
                this.operators[name] = this.operators[existing_name];
            }

        },

        inject_type: function(leech, property_name, host_type) {
            var host_name = this.get_or_create_dependency(host_type);
            this.add_cache_hierarchy(host_name, leech.name);
            leech.define(property_name, host_name, this);
        },

        get_or_create_dependency: function(type) {
            var index = this.recipes.indexOf(type);
            if (index === -1) {
                this.add(this.next_name(), type);
                index = this.recipes.indexOf(type);
            }
            return this.names[index];
        },

        add_cache_hierarchy: function(host, leech) {
            this.cache_hierarchy[host] = this.cache_hierarchy[host] || [];
            this.cache_hierarchy[host].push(leech);
        },

        purge: function(name) {
            var queue = this.cache_hierarchy[name] || [], new_queue;
            delete this.cache[name];
            while (queue.length) {
                new_queue = [];
                queue.forEach(function(dependency) {
                    delete this.cache[dependency];
                    new_queue = new_queue.concat(this.cache_hierarchy[dependency] || []);
                }, this);
                queue = new_queue;
            }
        },

        set: function(name, value) {
            this.operators[name].value = value;
            this.purge(name);
        },

        get: function(name) {
            if (this.cache.hasOwnProperty(name)) {
                return this.cache[name];
            }
            return this.cache[name] = this.operators[name].value;
        }

    });

    return Chef;
});