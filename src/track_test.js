const { transformFromAstSync } = require('@babel/core');
const  parser = require('@babel/parser');
const autoTrackPlugin = require('./auto_track_plugin');
const fs = require('fs');
const path = require('path');

const sourceCode = `
import aa from 'aa';
import * as bb from 'bb';
import {cc} from 'cc';
import 'dd';

/**
 * track
 */
function a () {
    console.log('aaa');
}

class B {
    bb() {
        return 'bbb';
    }
}

const c = () => 'ccc';

const d = function () {
    console.log('ddd');
}
`


const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous'
});

const { code } = transformFromAstSync(ast, sourceCode, {
    plugins: [[autoTrackPlugin, {
        trackerPath: 'tracker'
    }]]
});

console.log(code);