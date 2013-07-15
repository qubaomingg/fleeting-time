var express = require('express');
var api = require('../api');
var theme = require('./theme');
var ticket = require('../lib/ticket');
var env = require('./setting');
var path = require('path');
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var http = require('http');
var fs = require('fs');
var us = require('underscore')._;

var uploader = function(lo){
	this.tObj = new theme(lo);
}
uploader.prototype= {
	init: function(){
		var filelist = this.tObj.getFileList(), me = this;
		us.each(filelist.js, function(jsItem, i){
			if(jsItem.match(/\/lib\//)){
				var finalCode = me.compressJs(jsItem);
			}
		});
	},
	compressJs: function(filename){
		var orig_code = fs.readFileSync(filename, "utf8");
		var ast = jsp.parse(orig_code); // parse code and get the initial AST
		ast = pro.ast_mangle(ast); // get a new AST with mangled names
		ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
		var final_code = pro.gen_code(ast); // compressed code here
		return final_code;
	}
};
