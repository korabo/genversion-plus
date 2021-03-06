/* global describe,it,afterEach,beforeEach */

// See https://www.npmjs.com/package/command-line-test
const CliTest = require('command-line-test')
const path = require('path')
const fs = require('fs-extra')
const should = require('should')  // eslint-disable-line no-unused-vars
const firstline = require('firstline')
const pjson = require('../package')
const { rejects } = require('assert')

// If global command is used, you must 'npm link' before tests.
// const COMMAND = 'genversion';  // Global
const COMMAND = 'node bin/genversion-plus.js'  // Local

const P = '.tmp/v.js'

const removeTemp = function () {
  if (fs.existsSync(P)) {
    fs.unlinkSync(P)
    fs.rmdirSync(path.dirname(P))
  }
}

const readFileToArray = function () {
  const data = fs.readFileSync(P).toString()
  const lines = data.split(/\r?\n/);
  return lines
}

describe('genversion cli', function () {
  beforeEach(function () {
    removeTemp()
  })

  afterEach(function () {
    removeTemp()
  })

  it('should generate file and dir if they do not exist', function (done) {
    this.timeout(6000)
    const clit = new CliTest()

    clit.exec(`${COMMAND} ${P}`, function (err, response) {
      if (err) {
        console.error(err, response)
        return done(err)
      }

      // Should not have any output
      response.stdout.should.empty()
      response.stderr.should.empty()

      fs.existsSync(P).should.equal(true)

      return done()
    })
  })

  it('should not generate if unknown file exists', function (done) {
    // Generate file with unknown signature
    const INVALID_SIGNATURE = 'foobarcontent'
    fs.outputFileSync(P, INVALID_SIGNATURE)

    const clit = new CliTest()

    clit.exec(`${COMMAND} ${P}`, function (err, response) {
      if (err) {
        console.error(err, response)
        return done(err)
      }

      response.stderr.should.startWith('ERROR')

      // Ensure the file was not replaced
      firstline(P).then(function (line) {
        line.should.equal(INVALID_SIGNATURE)
        return done()
      }).catch(function (errc) {
        return done(errc)
      })
    })
  })

  it('should allow --gen es6 flag', function (done) {
    const clit = new CliTest()

    clit.exec(`${COMMAND} --gen es6 ${P}`, function (err, response) {
      if (err) {
        console.error(err, response)
        return done(err)
      }

      const lines = readFileToArray()
      lines[0].should.equal('// generated by genversion-plus')
      lines[1].should.equal(`export const version = '${pjson.version}'`)

      return done()
    })
  })

  it('should allow --semi and --gen es6 flag', function (done) {
    const clit = new CliTest()

    clit.exec(`${COMMAND} --semi --gen es6 ${P}`, function (err, response) {
      if (err) {
        console.error(err, response)
        return done(err)
      }

      const lines = readFileToArray()
      lines[0].should.equal('// generated by genversion-plus')
      lines[1].should.equal(`export const version = '${pjson.version}';`)

      return done()
    })
  })

  it('should allow verbose flag', function (done) {
    const clit = new CliTest()

    clit.exec(`${COMMAND} -v ${P}`, function (err, response) {
      if (err) {
        console.error(err, response)
        return done(err)
      }

      response.stdout.should.containEql(pjson.version)

      return done()
    })
  })

  it('should allow source argument with filepath', function (done) {
    const clit = new CliTest()

    const cmd = `${COMMAND} --source ./test/fixture/package.json ${P}`
    clit.exec(cmd, function (err, resp) {
      if (err) {
        console.error(err, resp)
        return done(err)
      }

      const lines = readFileToArray()
      lines[0].should.equal('// generated by genversion-plus')
      lines[1].should.equal(`exports.version = '0.1.2'`)

      return done()
    })
  })

  it('should allow source argument with dirpath', function (done) {
    const clit = new CliTest()

    const cmd = `${COMMAND} --source ./test/fixture ${P}`
    clit.exec(cmd, function (err, resp) {
      if (err) {
        console.error(err, resp)
        return done(err)
      }

      const lines = readFileToArray()
      lines[0].should.equal('// generated by genversion-plus')
      lines[1].should.equal(`exports.version = '0.1.2'`)

      return done()
    })
  })

  it('should detect missing target path', function (done) {
    const clit = new CliTest()

    clit.exec(`${COMMAND} -v`, function (err, response) {
      if (err) {
        console.error(err, response)
        return done(err)
      }

      // NOTE: response.stderr is null because process exited with code 1
      response.error.code.should.equal(1)

      return done()
    })
  })

  it('should show version', function (done) {
    const clit = new CliTest()

    clit.exec(`${COMMAND} --version`, function (err, response) {
      if (err) {
        console.error(err)
        return done(err)
      }

      response.stdout.should.equal(pjson.version)

      return done()
    })
  })
})
