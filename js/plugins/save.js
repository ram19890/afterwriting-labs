define(function (require) {

	var template = require('text!templates/plugins/save.hbs'),
      pm = require('utils/pluginmanager'),
		saveAs = require('saveAs'),
		preview = require('plugins/preview'),
		gd = require('utils/googledrive'),
		db = require('utils/dropbox'),
		$ = require('jquery'),
		tree = require('utils/tree'),
		forms = require('utils/forms'),
		decorator = require('utils/decorator'),
		data = require('modules/data');

	var plugin = pm.create_plugin('save', 'save', template);

	// LOCAL

	plugin.save_as_fountain = function () {
		forms.text('Select file name: ', data.data('fountain-filename') || 'screenplay.fountain', function (result) {
			data.parse();
			var blob = new Blob([data.script()], {
				type: "text/plain;charset=utf-8"
			});
			data.data('fountain-filename', result.text);
			data.data('pdf-filename', result.text.split('.')[0] + '.pdf');
			saveAs(blob, result.text);
		});
	};

	plugin.save_as_pdf = function () {
		forms.text('Select file name: ', data.data('pdf-filename') || 'screenplay.pdf', function (result) {
			preview.get_pdf(function (pdf) {
				data.data('pdf-filename', result.text);
				data.data('fountain-filename', result.text.split('.')[0] + '.fountain');
				saveAs(pdf.blob, result.text);
			});
		});
	};

	// DROPBOX

	plugin.dropbox_fountain = function () {
		save_to_cloud({
			client: db,
			save_callback: function (selected, filename) {
				data.parse();
				var path = selected.data.path,
					blob = new Blob([data.script()], {
						type: "text/plain;charset=utf-8"
					});
				if (selected.data.isFolder) {
					path += (path[path.length - 1] !== '/' ? '/' : '') + filename;
				}
				db.save(path, blob, function () {
					if (filename) {
						data.data('fountain-filename', filename);
					}
					file_saved();
					plugin.db_saved(path);
				});
			},
			selected: data.data('db-path'),
			list_options: {
				lazy: data.config.cloud_lazy_loading
			},
			default_filename: 'screenplay.fountain'
		});
	};

	plugin.dropbox_pdf = function () {
		save_to_cloud({
			client: db,
			save_callback: function (selected, filename) {
				var path = selected.data.path;
				if (selected.data.isFolder) {
					path += (path[path.length - 1] !== '/' ? '/' : '') + filename;
				}
				data.parse();
				preview.get_pdf(function (result) {
					db.save(path, result.blob, function () {
						if (filename) {
							data.data('pdf-filename', filename);
						}
						file_saved();
						data.data('db-pdf-path', path);
					});
				});
			},
			selected: data.data('db-pdf-path'),
			list_options: {
				pdfOnly: true,
				lazy: data.config.cloud_lazy_loading
			},
			default_filename: 'screenplay.pdf'
		});
	};

	// GOOGLE DRIVE

	plugin.google_drive_fountain = function () {
		save_to_cloud({
			client: gd,
			save_callback: function (selected, filename) {
				data.parse();
				var blob = new Blob([data.script()], {
					type: "text/plain;charset=utf-8"
				});
				gd.upload({
					blob: blob,
					convert: /\.gdoc$/.test(filename),
					filename: filename,
					callback: function (file) {
						if (filename) {
							data.data('fountain-filename', filename);
						}
						file_saved();
						plugin.gd_saved(file);
					},
					parents: selected.data.isRoot ? [] : [selected.data],
					fileid: selected.data.isFolder ? null : selected.data.id
				});
			},
			selected: data.data('gd-fileid'),
			selected_parents: data.data('gd-parents'),
			list_options: {
				writeOnly: true,
				lazy: data.config.cloud_lazy_loading
			},
			default_filename: 'screenplay.fountain'
		});
	};

	plugin.google_drive_pdf = function () {
		save_to_cloud({
			client: gd,
			save_callback: function (selected, filename) {
				data.parse();
				preview.get_pdf(function (pdf) {
					gd.upload({
						blob: pdf.blob,
						filename: filename,
						callback: function (file) {
							if (filename) {
								data.data('pdf-filename', filename);
							}
							file_saved();
							data.data('gd-pdf-id', file.id);
							var selected_parents = selected.parents.slice(0, selected.parents.length-2);
							if (selected.type === 'default') {
								selected_parents.unshift(selected.id);
							}
							data.data('gd-pdf-parents', selected_parents.reverse());
						},
						convert: false,
						parents: selected.data.isRoot ? [] : [selected.data],
						fileid: selected.data.isFolder ? null : selected.data.id,
					});
				});
			},
			selected: data.data('gd-pdf-id'),
			selected_parents: data.data('gd-pdf-parents'),
			list_options: {
				pdfOnly: true,
				writeOnly: true,
				lazy: data.config.cloud_lazy_loading
			},
			default_filename: 'screenplay.pdf'
		});
	};

	plugin.gd_saved = decorator.signal();
	plugin.db_saved = decorator.signal();

	plugin.is_dropbox_available = function () {
		return window.location.protocol !== 'file:';
	};

	plugin.is_google_drive_available = function () {
		return window.gapi && window.location.protocol !== 'file:';
	};

	/**
	 * Save to the cloud using options:
	 *  client - cloud client (dropox/googledrive)
	 *  list_options - options passed to the client's list call
	 *  selected - selected item
	 *  default_filename - default filename if none has been used before
	 *  save_callback - function call to save the file
	 */
	var save_to_cloud = function (options) {
		options.list_options = options.list_options || {};
		options.list_options.before = function () {
			$.prompt('Please wait...');
		};
		options.list_options.after = $.prompt.close;
		options.client.list(function (root) {
			root = typeof root !== 'function' ? options.client.convert_to_jstree(root) : root;
			tree.show({
				data: root,
				selected: options.selected,
				selected_parents: options.selected_parents,
				filename: options.default_filename,
				save: true,
				info: 'Select a file to override or choose a folder to save as a new file.',
				callback: function (selected, filename) {
					$.prompt('Please wait...');
					options.save_callback(selected, filename);
				}
			});
		}, options.list_options);
	};

	/**
	 * Display file saved message
	 */
	var file_saved = function () {
		$.prompt.close();
		$.prompt('File saved!');
	};

	return plugin;
});