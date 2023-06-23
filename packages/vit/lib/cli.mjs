
import { EventEmitter } from 'events';
import require$$0 from 'util';
import require$$1 from 'path';
import require$$2 from 'fs';
import require$$3 from 'os';
import require$$4 from 'tty';

function toArr(any) {
	return any == null ? [] : Array.isArray(any) ? any : [any];
}

function toVal(out, key, val, opts) {
	var x, old=out[key], nxt=(
		!!~opts.string.indexOf(key) ? (val == null || val === true ? '' : String(val))
		: typeof val === 'boolean' ? val
		: !!~opts.boolean.indexOf(key) ? (val === 'false' ? false : val === 'true' || (out._.push((x = +val,x * 0 === 0) ? x : val),!!val))
		: (x = +val,x * 0 === 0) ? x : val
	);
	out[key] = old == null ? nxt : (Array.isArray(old) ? old.concat(nxt) : [old, nxt]);
}

function mri2 (args, opts) {
	args = args || [];
	opts = opts || {};

	var k, arr, arg, name, val, out={ _:[] };
	var i=0, j=0, idx=0, len=args.length;

	const alibi = opts.alias !== void 0;
	const strict = opts.unknown !== void 0;
	const defaults = opts.default !== void 0;

	opts.alias = opts.alias || {};
	opts.string = toArr(opts.string);
	opts.boolean = toArr(opts.boolean);

	if (alibi) {
		for (k in opts.alias) {
			arr = opts.alias[k] = toArr(opts.alias[k]);
			for (i=0; i < arr.length; i++) {
				(opts.alias[arr[i]] = arr.concat(k)).splice(i, 1);
			}
		}
	}

	for (i=opts.boolean.length; i-- > 0;) {
		arr = opts.alias[opts.boolean[i]] || [];
		for (j=arr.length; j-- > 0;) opts.boolean.push(arr[j]);
	}

	for (i=opts.string.length; i-- > 0;) {
		arr = opts.alias[opts.string[i]] || [];
		for (j=arr.length; j-- > 0;) opts.string.push(arr[j]);
	}

	if (defaults) {
		for (k in opts.default) {
			name = typeof opts.default[k];
			arr = opts.alias[k] = opts.alias[k] || [];
			if (opts[name] !== void 0) {
				opts[name].push(k);
				for (i=0; i < arr.length; i++) {
					opts[name].push(arr[i]);
				}
			}
		}
	}

	const keys = strict ? Object.keys(opts.alias) : [];

	for (i=0; i < len; i++) {
		arg = args[i];

		if (arg === '--') {
			out._ = out._.concat(args.slice(++i));
			break;
		}

		for (j=0; j < arg.length; j++) {
			if (arg.charCodeAt(j) !== 45) break; // "-"
		}

		if (j === 0) {
			out._.push(arg);
		} else if (arg.substring(j, j + 3) === 'no-') {
			name = arg.substring(j + 3);
			if (strict && !~keys.indexOf(name)) {
				return opts.unknown(arg);
			}
			out[name] = false;
		} else {
			for (idx=j+1; idx < arg.length; idx++) {
				if (arg.charCodeAt(idx) === 61) break; // "="
			}

			name = arg.substring(j, idx);
			val = arg.substring(++idx) || (i+1 === len || (''+args[i+1]).charCodeAt(0) === 45 || args[++i]);
			arr = (j === 2 ? [name] : name);

			for (idx=0; idx < arr.length; idx++) {
				name = arr[idx];
				if (strict && !~keys.indexOf(name)) return opts.unknown('-'.repeat(j) + name);
				toVal(out, name, (idx + 1 < arr.length) || val, opts);
			}
		}
	}

	if (defaults) {
		for (k in opts.default) {
			if (out[k] === void 0) {
				out[k] = opts.default[k];
			}
		}
	}

	if (alibi) {
		for (k in out) {
			arr = opts.alias[k] || [];
			while (arr.length > 0) {
				out[arr.shift()] = out[k];
			}
		}
	}

	return out;
}

const removeBrackets = (v) => v.replace(/[<[].+/, "").trim();
const findAllBrackets = (v) => {
  const ANGLED_BRACKET_RE_GLOBAL = /<([^>]+)>/g;
  const SQUARE_BRACKET_RE_GLOBAL = /\[([^\]]+)\]/g;
  const res = [];
  const parse = (match) => {
    let variadic = false;
    let value = match[1];
    if (value.startsWith("...")) {
      value = value.slice(3);
      variadic = true;
    }
    return {
      required: match[0].startsWith("<"),
      value,
      variadic
    };
  };
  let angledMatch;
  while (angledMatch = ANGLED_BRACKET_RE_GLOBAL.exec(v)) {
    res.push(parse(angledMatch));
  }
  let squareMatch;
  while (squareMatch = SQUARE_BRACKET_RE_GLOBAL.exec(v)) {
    res.push(parse(squareMatch));
  }
  return res;
};
const getMriOptions = (options) => {
  const result = {alias: {}, boolean: []};
  for (const [index, option] of options.entries()) {
    if (option.names.length > 1) {
      result.alias[option.names[0]] = option.names.slice(1);
    }
    if (option.isBoolean) {
      if (option.negated) {
        const hasStringTypeOption = options.some((o, i) => {
          return i !== index && o.names.some((name) => option.names.includes(name)) && typeof o.required === "boolean";
        });
        if (!hasStringTypeOption) {
          result.boolean.push(option.names[0]);
        }
      } else {
        result.boolean.push(option.names[0]);
      }
    }
  }
  return result;
};
const findLongest = (arr) => {
  return arr.sort((a, b) => {
    return a.length > b.length ? -1 : 1;
  })[0];
};
const padRight = (str, length) => {
  return str.length >= length ? str : `${str}${" ".repeat(length - str.length)}`;
};
const camelcase = (input) => {
  return input.replace(/([a-z])-([a-z])/g, (_, p1, p2) => {
    return p1 + p2.toUpperCase();
  });
};
const setDotProp = (obj, keys, val) => {
  let i = 0;
  let length = keys.length;
  let t = obj;
  let x;
  for (; i < length; ++i) {
    x = t[keys[i]];
    t = t[keys[i]] = i === length - 1 ? val : x != null ? x : !!~keys[i + 1].indexOf(".") || !(+keys[i + 1] > -1) ? {} : [];
  }
};
const setByType = (obj, transforms) => {
  for (const key of Object.keys(transforms)) {
    const transform = transforms[key];
    if (transform.shouldTransform) {
      obj[key] = Array.prototype.concat.call([], obj[key]);
      if (typeof transform.transformFunction === "function") {
        obj[key] = obj[key].map(transform.transformFunction);
      }
    }
  }
};
const getFileName = (input) => {
  const m = /([^\\\/]+)$/.exec(input);
  return m ? m[1] : "";
};
const camelcaseOptionName = (name) => {
  return name.split(".").map((v, i) => {
    return i === 0 ? camelcase(v) : v;
  }).join(".");
};
class CACError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

class Option {
  constructor(rawName, description, config) {
    this.rawName = rawName;
    this.description = description;
    this.config = Object.assign({}, config);
    rawName = rawName.replace(/\.\*/g, "");
    this.negated = false;
    this.names = removeBrackets(rawName).split(",").map((v) => {
      let name = v.trim().replace(/^-{1,2}/, "");
      if (name.startsWith("no-")) {
        this.negated = true;
        name = name.replace(/^no-/, "");
      }
      return camelcaseOptionName(name);
    }).sort((a, b) => a.length > b.length ? 1 : -1);
    this.name = this.names[this.names.length - 1];
    if (this.negated && this.config.default == null) {
      this.config.default = true;
    }
    if (rawName.includes("<")) {
      this.required = true;
    } else if (rawName.includes("[")) {
      this.required = false;
    } else {
      this.isBoolean = true;
    }
  }
}

const processArgs = process.argv;
const platformInfo = `${process.platform}-${process.arch} node-${process.version}`;

class Command {
  constructor(rawName, description, config = {}, cli) {
    this.rawName = rawName;
    this.description = description;
    this.config = config;
    this.cli = cli;
    this.options = [];
    this.aliasNames = [];
    this.name = removeBrackets(rawName);
    this.args = findAllBrackets(rawName);
    this.examples = [];
  }
  usage(text) {
    this.usageText = text;
    return this;
  }
  allowUnknownOptions() {
    this.config.allowUnknownOptions = true;
    return this;
  }
  ignoreOptionDefaultValue() {
    this.config.ignoreOptionDefaultValue = true;
    return this;
  }
  version(version, customFlags = "-v, --version") {
    this.versionNumber = version;
    this.option(customFlags, "Display version number");
    return this;
  }
  example(example) {
    this.examples.push(example);
    return this;
  }
  option(rawName, description, config) {
    const option = new Option(rawName, description, config);
    this.options.push(option);
    return this;
  }
  alias(name) {
    this.aliasNames.push(name);
    return this;
  }
  action(callback) {
    this.commandAction = callback;
    return this;
  }
  isMatched(name) {
    return this.name === name || this.aliasNames.includes(name);
  }
  get isDefaultCommand() {
    return this.name === "" || this.aliasNames.includes("!");
  }
  get isGlobalCommand() {
    return this instanceof GlobalCommand;
  }
  hasOption(name) {
    name = name.split(".")[0];
    return this.options.find((option) => {
      return option.names.includes(name);
    });
  }
  outputHelp() {
    const {name, commands} = this.cli;
    const {
      versionNumber,
      options: globalOptions,
      helpCallback
    } = this.cli.globalCommand;
    let sections = [
      {
        body: `${name}${versionNumber ? `/${versionNumber}` : ""}`
      }
    ];
    sections.push({
      title: "Usage",
      body: `  $ ${name} ${this.usageText || this.rawName}`
    });
    const showCommands = (this.isGlobalCommand || this.isDefaultCommand) && commands.length > 0;
    if (showCommands) {
      const longestCommandName = findLongest(commands.map((command) => command.rawName));
      sections.push({
        title: "Commands",
        body: commands.map((command) => {
          return `  ${padRight(command.rawName, longestCommandName.length)}  ${command.description}`;
        }).join("\n")
      });
      sections.push({
        title: `For more info, run any command with the \`--help\` flag`,
        body: commands.map((command) => `  $ ${name}${command.name === "" ? "" : ` ${command.name}`} --help`).join("\n")
      });
    }
    let options = this.isGlobalCommand ? globalOptions : [...this.options, ...globalOptions || []];
    if (!this.isGlobalCommand && !this.isDefaultCommand) {
      options = options.filter((option) => option.name !== "version");
    }
    if (options.length > 0) {
      const longestOptionName = findLongest(options.map((option) => option.rawName));
      sections.push({
        title: "Options",
        body: options.map((option) => {
          return `  ${padRight(option.rawName, longestOptionName.length)}  ${option.description} ${option.config.default === void 0 ? "" : `(default: ${option.config.default})`}`;
        }).join("\n")
      });
    }
    if (this.examples.length > 0) {
      sections.push({
        title: "Examples",
        body: this.examples.map((example) => {
          if (typeof example === "function") {
            return example(name);
          }
          return example;
        }).join("\n")
      });
    }
    if (helpCallback) {
      sections = helpCallback(sections) || sections;
    }
    console.log(sections.map((section) => {
      return section.title ? `${section.title}:
${section.body}` : section.body;
    }).join("\n\n"));
  }
  outputVersion() {
    const {name} = this.cli;
    const {versionNumber} = this.cli.globalCommand;
    if (versionNumber) {
      console.log(`${name}/${versionNumber} ${platformInfo}`);
    }
  }
  checkRequiredArgs() {
    const minimalArgsCount = this.args.filter((arg) => arg.required).length;
    if (this.cli.args.length < minimalArgsCount) {
      throw new CACError(`missing required args for command \`${this.rawName}\``);
    }
  }
  checkUnknownOptions() {
    const {options, globalCommand} = this.cli;
    if (!this.config.allowUnknownOptions) {
      for (const name of Object.keys(options)) {
        if (name !== "--" && !this.hasOption(name) && !globalCommand.hasOption(name)) {
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
        }
      }
    }
  }
  checkOptionValue() {
    const {options: parsedOptions, globalCommand} = this.cli;
    const options = [...globalCommand.options, ...this.options];
    for (const option of options) {
      const value = parsedOptions[option.name.split(".")[0]];
      if (option.required) {
        const hasNegated = options.some((o) => o.negated && o.names.includes(option.name));
        if (value === true || value === false && !hasNegated) {
          throw new CACError(`option \`${option.rawName}\` value is missing`);
        }
      }
    }
  }
}
class GlobalCommand extends Command {
  constructor(cli) {
    super("@@global@@", "", {}, cli);
  }
}

var __assign = Object.assign;
class CAC extends EventEmitter {
  constructor(name = "") {
    super();
    this.name = name;
    this.commands = [];
    this.rawArgs = [];
    this.args = [];
    this.options = {};
    this.globalCommand = new GlobalCommand(this);
    this.globalCommand.usage("<command> [options]");
  }
  usage(text) {
    this.globalCommand.usage(text);
    return this;
  }
  command(rawName, description, config) {
    const command = new Command(rawName, description || "", config, this);
    command.globalCommand = this.globalCommand;
    this.commands.push(command);
    return command;
  }
  option(rawName, description, config) {
    this.globalCommand.option(rawName, description, config);
    return this;
  }
  help(callback) {
    this.globalCommand.option("-h, --help", "Display this message");
    this.globalCommand.helpCallback = callback;
    this.showHelpOnExit = true;
    return this;
  }
  version(version, customFlags = "-v, --version") {
    this.globalCommand.version(version, customFlags);
    this.showVersionOnExit = true;
    return this;
  }
  example(example) {
    this.globalCommand.example(example);
    return this;
  }
  outputHelp() {
    if (this.matchedCommand) {
      this.matchedCommand.outputHelp();
    } else {
      this.globalCommand.outputHelp();
    }
  }
  outputVersion() {
    this.globalCommand.outputVersion();
  }
  setParsedInfo({args, options}, matchedCommand, matchedCommandName) {
    this.args = args;
    this.options = options;
    if (matchedCommand) {
      this.matchedCommand = matchedCommand;
    }
    if (matchedCommandName) {
      this.matchedCommandName = matchedCommandName;
    }
    return this;
  }
  unsetMatchedCommand() {
    this.matchedCommand = void 0;
    this.matchedCommandName = void 0;
  }
  parse(argv = processArgs, {
    run = true
  } = {}) {
    this.rawArgs = argv;
    if (!this.name) {
      this.name = argv[1] ? getFileName(argv[1]) : "cli";
    }
    let shouldParse = true;
    for (const command of this.commands) {
      const parsed = this.mri(argv.slice(2), command);
      const commandName = parsed.args[0];
      if (command.isMatched(commandName)) {
        shouldParse = false;
        const parsedInfo = __assign(__assign({}, parsed), {
          args: parsed.args.slice(1)
        });
        this.setParsedInfo(parsedInfo, command, commandName);
        this.emit(`command:${commandName}`, command);
      }
    }
    if (shouldParse) {
      for (const command of this.commands) {
        if (command.name === "") {
          shouldParse = false;
          const parsed = this.mri(argv.slice(2), command);
          this.setParsedInfo(parsed, command);
          this.emit(`command:!`, command);
        }
      }
    }
    if (shouldParse) {
      const parsed = this.mri(argv.slice(2));
      this.setParsedInfo(parsed);
    }
    if (this.options.help && this.showHelpOnExit) {
      this.outputHelp();
      run = false;
      this.unsetMatchedCommand();
    }
    if (this.options.version && this.showVersionOnExit && this.matchedCommandName == null) {
      this.outputVersion();
      run = false;
      this.unsetMatchedCommand();
    }
    const parsedArgv = {args: this.args, options: this.options};
    if (run) {
      this.runMatchedCommand();
    }
    if (!this.matchedCommand && this.args[0]) {
      this.emit("command:*");
    }
    return parsedArgv;
  }
  mri(argv, command) {
    const cliOptions = [
      ...this.globalCommand.options,
      ...command ? command.options : []
    ];
    const mriOptions = getMriOptions(cliOptions);
    let argsAfterDoubleDashes = [];
    const doubleDashesIndex = argv.indexOf("--");
    if (doubleDashesIndex > -1) {
      argsAfterDoubleDashes = argv.slice(doubleDashesIndex + 1);
      argv = argv.slice(0, doubleDashesIndex);
    }
    let parsed = mri2(argv, mriOptions);
    parsed = Object.keys(parsed).reduce((res, name) => {
      return __assign(__assign({}, res), {
        [camelcaseOptionName(name)]: parsed[name]
      });
    }, {_: []});
    const args = parsed._;
    const options = {
      "--": argsAfterDoubleDashes
    };
    const ignoreDefault = command && command.config.ignoreOptionDefaultValue ? command.config.ignoreOptionDefaultValue : this.globalCommand.config.ignoreOptionDefaultValue;
    let transforms = Object.create(null);
    for (const cliOption of cliOptions) {
      if (!ignoreDefault && cliOption.config.default !== void 0) {
        for (const name of cliOption.names) {
          options[name] = cliOption.config.default;
        }
      }
      if (Array.isArray(cliOption.config.type)) {
        if (transforms[cliOption.name] === void 0) {
          transforms[cliOption.name] = Object.create(null);
          transforms[cliOption.name]["shouldTransform"] = true;
          transforms[cliOption.name]["transformFunction"] = cliOption.config.type[0];
        }
      }
    }
    for (const key of Object.keys(parsed)) {
      if (key !== "_") {
        const keys = key.split(".");
        setDotProp(options, keys, parsed[key]);
        setByType(options, transforms);
      }
    }
    return {
      args,
      options
    };
  }
  runMatchedCommand() {
    const {args, options, matchedCommand: command} = this;
    if (!command || !command.commandAction)
      return;
    command.checkUnknownOptions();
    command.checkOptionValue();
    command.checkRequiredArgs();
    const actionArgs = [];
    command.args.forEach((arg, index) => {
      if (arg.variadic) {
        actionArgs.push(args.slice(index));
      } else {
        actionArgs.push(args[index]);
      }
    });
    actionArgs.push(options);
    return command.commandAction.apply(this, actionArgs);
  }
}

const cac = (name = "") => new CAC(name);

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

function u(u){return u&&"object"==typeof u&&"default"in u?u.default:u}var D=u(require$$0),e=require$$1,t=require$$2,r=u(require$$3),n=u(require$$4);function s(u,D){return u(D={exports:{}},D.exports),D.exports}var o,i=(o=Object.freeze({__proto__:null,default:[{name:"AppVeyor",constant:"APPVEYOR",env:"APPVEYOR",pr:"APPVEYOR_PULL_REQUEST_NUMBER"},{name:"Bamboo",constant:"BAMBOO",env:"bamboo_planKey"},{name:"Bitbucket Pipelines",constant:"BITBUCKET",env:"BITBUCKET_COMMIT"},{name:"Bitrise",constant:"BITRISE",env:"BITRISE_IO",pr:"BITRISE_PULL_REQUEST"},{name:"Buddy",constant:"BUDDY",env:"BUDDY_WORKSPACE_ID",pr:"BUDDY_EXECUTION_PULL_REQUEST_ID"},{name:"Buildkite",constant:"BUILDKITE",env:"BUILDKITE",pr:{env:"BUILDKITE_PULL_REQUEST",ne:"false"}},{name:"CircleCI",constant:"CIRCLE",env:"CIRCLECI",pr:"CIRCLE_PULL_REQUEST"},{name:"Cirrus CI",constant:"CIRRUS",env:"CIRRUS_CI",pr:"CIRRUS_PR"},{name:"AWS CodeBuild",constant:"CODEBUILD",env:"CODEBUILD_BUILD_ARN"},{name:"Codeship",constant:"CODESHIP",env:{CI_NAME:"codeship"}},{name:"Drone",constant:"DRONE",env:"DRONE",pr:{DRONE_BUILD_EVENT:"pull_request"}},{name:"dsari",constant:"DSARI",env:"DSARI"},{name:"GitLab CI",constant:"GITLAB",env:"GITLAB_CI"},{name:"GoCD",constant:"GOCD",env:"GO_PIPELINE_LABEL"},{name:"Hudson",constant:"HUDSON",env:"HUDSON_URL"},{name:"Jenkins",constant:"JENKINS",env:["JENKINS_URL","BUILD_ID"],pr:{any:["ghprbPullId","CHANGE_ID"]}},{name:"Magnum CI",constant:"MAGNUM",env:"MAGNUM"},{name:"Sail CI",constant:"SAIL",env:"SAILCI",pr:"SAIL_PULL_REQUEST_NUMBER"},{name:"Semaphore",constant:"SEMAPHORE",env:"SEMAPHORE",pr:"PULL_REQUEST_NUMBER"},{name:"Shippable",constant:"SHIPPABLE",env:"SHIPPABLE",pr:{IS_PULL_REQUEST:"true"}},{name:"Solano CI",constant:"SOLANO",env:"TDDIUM",pr:"TDDIUM_PR_ID"},{name:"Strider CD",constant:"STRIDER",env:"STRIDER"},{name:"TaskCluster",constant:"TASKCLUSTER",env:["TASK_ID","RUN_ID"]},{name:"Solano CI",constant:"TDDIUM",env:"TDDIUM",pr:"TDDIUM_PR_ID",deprecated:!0},{name:"TeamCity",constant:"TEAMCITY",env:"TEAMCITY_VERSION"},{name:"Team Foundation Server",constant:"TFS",env:"TF_BUILD"},{name:"Travis CI",constant:"TRAVIS",env:"TRAVIS",pr:{env:"TRAVIS_PULL_REQUEST",ne:"false"}}]}))&&o.default||o,a=s((function(u,D){var e=process.env;function t(u){return "string"==typeof u?!!e[u]:Object.keys(u).every((function(D){return e[D]===u[D]}))}Object.defineProperty(D,"_vendors",{value:i.map((function(u){return u.constant}))}),D.name=null,D.isPR=null,i.forEach((function(u){var r=(Array.isArray(u.env)?u.env:[u.env]).every((function(u){return t(u)}));if(D[u.constant]=r,r)switch(D.name=u.name,typeof u.pr){case"string":D.isPR=!!e[u.pr];break;case"object":"env"in u.pr?D.isPR=u.pr.env in e&&e[u.pr.env]!==u.pr.ne:"any"in u.pr?D.isPR=u.pr.any.some((function(u){return !!e[u]})):D.isPR=t(u.pr);break;default:D.isPR=null;}})),D.isCI=!!(e.CI||e.CONTINUOUS_INTEGRATION||e.BUILD_NUMBER||e.RUN_ID||D.name);})),l=(a.name,a.isPR,a.isCI,!1),c=!1,h=!1,F="development",C="undefined"!=typeof window,f="",E=!1;function g(u){return !(!u||"false"===u)}"undefined"!=typeof process&&(process.platform&&(f=String(process.platform)),process.stdout&&(h=g(process.stdout.isTTY)),l=Boolean(a.isCI),process.env&&(process.env.NODE_ENV&&(F=process.env.NODE_ENV),c=g(process.env.DEBUG),E=g(process.env.MINIMAL)));var d={browser:C,test:"test"===F,dev:"development"===F||"dev"===F,production:"production"===F,debug:c,ci:l,tty:h,minimal:void 0,minimalCLI:void 0,windows:/^win/i.test(f),darwin:/^darwin/i.test(f),linux:/^linux/i.test(f)};d.minimal=E||d.ci||d.test||!d.tty,d.minimalCLI=d.minimal;var p=Object.freeze(d);const m={};m[m.Fatal=0]="Fatal",m[m.Error=0]="Error",m[m.Warn=1]="Warn",m[m.Log=2]="Log",m[m.Info=3]="Info",m[m.Success=3]="Success",m[m.Debug=4]="Debug",m[m.Trace=5]="Trace",m[m.Silent=-1/0]="Silent",m[m.Verbose=1/0]="Verbose";var b={silent:{level:-1},fatal:{level:m.Fatal},error:{level:m.Error},warn:{level:m.Warn},log:{level:m.Log},info:{level:m.Info},success:{level:m.Success},debug:{level:m.Debug},trace:{level:m.Trace},verbose:{level:m.Trace},ready:{level:m.Info},start:{level:m.Info}};function y(u){return D=u,"[object Object]"===Object.prototype.toString.call(D)&&(!(!u.message&&!u.args)&&!u.stack);var D;}let B=!1;const v=[];class _{constructor(u={}){this._reporters=u.reporters||[],this._types=u.types||b,this.level=void 0!==u.level?u.level:3,this._defaults=u.defaults||{},this._async=void 0!==u.async?u.async:void 0,this._stdout=u.stdout,this._stderr=u.stderr,this._mockFn=u.mockFn,this._throttle=u.throttle||1e3,this._throttleMin=u.throttleMin||5;for(const u in this._types){const D={type:u,...this._types[u],...this._defaults};this[u]=this._wrapLogFn(D),this[u].raw=this._wrapLogFn(D,!0);}this._mockFn&&this.mockTypes(),this._lastLogSerialized=void 0,this._lastLog=void 0,this._lastLogTime=void 0,this._lastLogCount=0,this._throttleTimeout=void 0;}get stdout(){return this._stdout||console._stdout}get stderr(){return this._stderr||console._stderr}create(u){return new _(Object.assign({reporters:this._reporters,level:this.level,types:this._types,defaults:this._defaults,stdout:this._stdout,stderr:this._stderr,mockFn:this._mockFn},u))}withDefaults(u){return this.create({defaults:Object.assign({},this._defaults,u)})}withTag(u){return this.withDefaults({tag:this._defaults.tag?this._defaults.tag+":"+u:u})}addReporter(u){return this._reporters.push(u),this}removeReporter(u){if(u){const D=this._reporters.indexOf(u);if(D>=0)return this._reporters.splice(D,1)}else this._reporters.splice(0);return this}setReporters(u){return this._reporters=Array.isArray(u)?u:[u],this}wrapAll(){this.wrapConsole(),this.wrapStd();}restoreAll(){this.restoreConsole(),this.restoreStd();}wrapConsole(){for(const u in this._types)console["__"+u]||(console["__"+u]=console[u]),console[u]=this[u].raw;}restoreConsole(){for(const u in this._types)console["__"+u]&&(console[u]=console["__"+u],delete console["__"+u]);}wrapStd(){this._wrapStream(this.stdout,"log"),this._wrapStream(this.stderr,"log");}_wrapStream(u,D){u&&(u.__write||(u.__write=u.write),u.write=u=>{this[D].raw(String(u).trim());});}restoreStd(){this._restoreStream(this.stdout),this._restoreStream(this.stderr);}_restoreStream(u){u&&u.__write&&(u.write=u.__write,delete u.__write);}pauseLogs(){B=!0;}resumeLogs(){B=!1;const u=v.splice(0);for(const D of u)D[0]._logFn(D[1],D[2]);}mockTypes(u){if(this._mockFn=u||this._mockFn,"function"==typeof this._mockFn)for(const u in this._types)this[u]=this._mockFn(u,this._types[u])||this[u],this[u].raw=this[u];}_wrapLogFn(u,D){return (...e)=>{if(!B)return this._logFn(u,e,D);v.push([this,u,e,D]);}}_logFn(u,D,e){if(u.level>this.level)return !!this._async&&Promise.resolve(!1);const t=Object.assign({date:new Date,args:[]},u);!e&&1===D.length&&y(D[0])?Object.assign(t,D[0]):t.args=Array.from(D),t.message&&(t.args.unshift(t.message),delete t.message),t.additional&&(Array.isArray(t.additional)||(t.additional=t.additional.split("\n")),t.args.push("\n"+t.additional.join("\n")),delete t.additional),t.type="string"==typeof t.type?t.type.toLowerCase():"",t.tag="string"==typeof t.tag?t.tag.toLowerCase():"";const r=(u=!1)=>{const D=this._lastLogCount-this._throttleMin;if(this._lastLog&&D>0){const u=[...this._lastLog.args];D>1&&u.push(`(repeated ${D} times)`),this._log({...this._lastLog,args:u}),this._lastLogCount=1;}if(u){if(this._lastLog=t,this._async)return this._logAsync(t);this._log(t);}};clearTimeout(this._throttleTimeout);const n=this._lastLogTime?t.date-this._lastLogTime:0;if(this._lastLogTime=t.date,n<this._throttle)try{const u=JSON.stringify([t.type,t.tag,t.args]),D=this._lastLogSerialized===u;if(this._lastLogSerialized=u,D&&(this._lastLogCount++,this._lastLogCount>this._throttleMin))return void(this._throttleTimeout=setTimeout(r,this._throttle))}catch(u){}r(!0);}_log(u){for(const D of this._reporters)D.log(u,{async:!1,stdout:this.stdout,stderr:this.stderr});}_logAsync(u){return Promise.all(this._reporters.map(D=>D.log(u,{async:!0,stdout:this.stdout,stderr:this.stderr})))}}function A(u){const D=process.cwd()+e.sep;return u.split("\n").splice(1).map(u=>u.trim().replace("file://","").replace(D,""))}_.prototype.add=_.prototype.addReporter,_.prototype.remove=_.prototype.removeReporter,_.prototype.clear=_.prototype.removeReporter,_.prototype.withScope=_.prototype.withTag,_.prototype.mock=_.prototype.mockTypes,_.prototype.pause=_.prototype.pauseLogs,_.prototype.resume=_.prototype.resumeLogs;var w=s((function(u,D){u.exports=function(){var u="millisecond",D="second",e="minute",t="hour",r="day",n="week",s="month",o="quarter",i="year",a=/^(\d{4})-?(\d{1,2})-?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?.?(\d{1,3})?$/,l=/\[([^\]]+)]|Y{2,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,c=function(u,D,e){var t=String(u);return !t||t.length>=D?u:""+Array(D+1-t.length).join(e)+u},h={s:c,z:function(u){var D=-u.utcOffset(),e=Math.abs(D),t=Math.floor(e/60),r=e%60;return (D<=0?"+":"-")+c(t,2,"0")+":"+c(r,2,"0")},m:function(u,D){var e=12*(D.year()-u.year())+(D.month()-u.month()),t=u.clone().add(e,s),r=D-t<0,n=u.clone().add(e+(r?-1:1),s);return Number(-(e+(D-t)/(r?t-n:n-t))||0)},a:function(u){return u<0?Math.ceil(u)||0:Math.floor(u)},p:function(a){return {M:s,y:i,w:n,d:r,D:"date",h:t,m:e,s:D,ms:u,Q:o}[a]||String(a||"").toLowerCase().replace(/s$/,"")},u:function(u){return void 0===u}},F={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},C="en",f={};f[C]=F;var E=function(u){return u instanceof m},g=function(u,D,e){var t;if(!u)return C;if("string"==typeof u)f[u]&&(t=u),D&&(f[u]=D,t=u);else {var r=u.name;f[r]=u,t=r;}return !e&&t&&(C=t),t||!e&&C},d=function(u,D){if(E(u))return u.clone();var e="object"==typeof D?D:{};return e.date=u,e.args=arguments,new m(e)},p=h;p.l=g,p.i=E,p.w=function(u,D){return d(u,{locale:D.$L,utc:D.$u,$offset:D.$offset})};var m=function(){function c(u){this.$L=this.$L||g(u.locale,null,!0),this.parse(u);}var h=c.prototype;return h.parse=function(u){this.$d=function(u){var D=u.date,e=u.utc;if(null===D)return new Date(NaN);if(p.u(D))return new Date;if(D instanceof Date)return new Date(D);if("string"==typeof D&&!/Z$/i.test(D)){var t=D.match(a);if(t)return e?new Date(Date.UTC(t[1],t[2]-1,t[3]||1,t[4]||0,t[5]||0,t[6]||0,t[7]||0)):new Date(t[1],t[2]-1,t[3]||1,t[4]||0,t[5]||0,t[6]||0,t[7]||0)}return new Date(D)}(u),this.init();},h.init=function(){var u=this.$d;this.$y=u.getFullYear(),this.$M=u.getMonth(),this.$D=u.getDate(),this.$W=u.getDay(),this.$H=u.getHours(),this.$m=u.getMinutes(),this.$s=u.getSeconds(),this.$ms=u.getMilliseconds();},h.$utils=function(){return p},h.isValid=function(){return !("Invalid Date"===this.$d.toString())},h.isSame=function(u,D){var e=d(u);return this.startOf(D)<=e&&e<=this.endOf(D)},h.isAfter=function(u,D){return d(u)<this.startOf(D)},h.isBefore=function(u,D){return this.endOf(D)<d(u)},h.$g=function(u,D,e){return p.u(u)?this[D]:this.set(e,u)},h.year=function(u){return this.$g(u,"$y",i)},h.month=function(u){return this.$g(u,"$M",s)},h.day=function(u){return this.$g(u,"$W",r)},h.date=function(u){return this.$g(u,"$D","date")},h.hour=function(u){return this.$g(u,"$H",t)},h.minute=function(u){return this.$g(u,"$m",e)},h.second=function(u){return this.$g(u,"$s",D)},h.millisecond=function(D){return this.$g(D,"$ms",u)},h.unix=function(){return Math.floor(this.valueOf()/1e3)},h.valueOf=function(){return this.$d.getTime()},h.startOf=function(u,o){var a=this,l=!!p.u(o)||o,c=p.p(u),h=function(u,D){var e=p.w(a.$u?Date.UTC(a.$y,D,u):new Date(a.$y,D,u),a);return l?e:e.endOf(r)},F=function(u,D){return p.w(a.toDate()[u].apply(a.toDate("s"),(l?[0,0,0,0]:[23,59,59,999]).slice(D)),a)},C=this.$W,f=this.$M,E=this.$D,g="set"+(this.$u?"UTC":"");switch(c){case i:return l?h(1,0):h(31,11);case s:return l?h(1,f):h(0,f+1);case n:var d=this.$locale().weekStart||0,m=(C<d?C+7:C)-d;return h(l?E-m:E+(6-m),f);case r:case"date":return F(g+"Hours",0);case t:return F(g+"Minutes",1);case e:return F(g+"Seconds",2);case D:return F(g+"Milliseconds",3);default:return this.clone()}},h.endOf=function(u){return this.startOf(u,!1)},h.$set=function(n,o){var a,l=p.p(n),c="set"+(this.$u?"UTC":""),h=(a={},a.day=c+"Date",a.date=c+"Date",a[s]=c+"Month",a[i]=c+"FullYear",a[t]=c+"Hours",a[e]=c+"Minutes",a[D]=c+"Seconds",a[u]=c+"Milliseconds",a)[l],F=l===r?this.$D+(o-this.$W):o;if(l===s||l===i){var C=this.clone().set("date",1);C.$d[h](F),C.init(),this.$d=C.set("date",Math.min(this.$D,C.daysInMonth())).toDate();}else h&&this.$d[h](F);return this.init(),this},h.set=function(u,D){return this.clone().$set(u,D)},h.get=function(u){return this[p.p(u)]()},h.add=function(u,o){var a,l=this;u=Number(u);var c=p.p(o),h=function(D){var e=d(l);return p.w(e.date(e.date()+Math.round(D*u)),l)};if(c===s)return this.set(s,this.$M+u);if(c===i)return this.set(i,this.$y+u);if(c===r)return h(1);if(c===n)return h(7);var F=(a={},a[e]=6e4,a[t]=36e5,a[D]=1e3,a)[c]||1,C=this.$d.getTime()+u*F;return p.w(C,this)},h.subtract=function(u,D){return this.add(-1*u,D)},h.format=function(u){var D=this;if(!this.isValid())return "Invalid Date";var e=u||"YYYY-MM-DDTHH:mm:ssZ",t=p.z(this),r=this.$locale(),n=this.$H,s=this.$m,o=this.$M,i=r.weekdays,a=r.months,c=function(u,t,r,n){return u&&(u[t]||u(D,e))||r[t].substr(0,n)},h=function(u){return p.s(n%12||12,u,"0")},F=r.meridiem||function(u,D,e){var t=u<12?"AM":"PM";return e?t.toLowerCase():t},C={YY:String(this.$y).slice(-2),YYYY:this.$y,M:o+1,MM:p.s(o+1,2,"0"),MMM:c(r.monthsShort,o,a,3),MMMM:c(a,o),D:this.$D,DD:p.s(this.$D,2,"0"),d:String(this.$W),dd:c(r.weekdaysMin,this.$W,i,2),ddd:c(r.weekdaysShort,this.$W,i,3),dddd:i[this.$W],H:String(n),HH:p.s(n,2,"0"),h:h(1),hh:h(2),a:F(n,s,!0),A:F(n,s,!1),m:String(s),mm:p.s(s,2,"0"),s:String(this.$s),ss:p.s(this.$s,2,"0"),SSS:p.s(this.$ms,3,"0"),Z:t};return e.replace(l,(function(u,D){return D||C[u]||t.replace(":","")}))},h.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},h.diff=function(u,r,a){var l,c=p.p(r),h=d(u),F=6e4*(h.utcOffset()-this.utcOffset()),C=this-h,f=p.m(this,h);return f=(l={},l[i]=f/12,l[s]=f,l[o]=f/3,l[n]=(C-F)/6048e5,l.day=(C-F)/864e5,l[t]=C/36e5,l[e]=C/6e4,l[D]=C/1e3,l)[c]||C,a?f:p.a(f)},h.daysInMonth=function(){return this.endOf(s).$D},h.$locale=function(){return f[this.$L]},h.locale=function(u,D){if(!u)return this.$L;var e=this.clone(),t=g(u,D,!0);return t&&(e.$L=t),e},h.clone=function(){return p.w(this.$d,this)},h.toDate=function(){return new Date(this.valueOf())},h.toJSON=function(){return this.isValid()?this.toISOString():null},h.toISOString=function(){return this.$d.toISOString()},h.toString=function(){return this.$d.toUTCString()},c}();return d.prototype=m.prototype,d.extend=function(u,D){return u(D,m,d),d},d.locale=g,d.isDayjs=E,d.unix=function(u){return d(1e3*u)},d.en=f[C],d.Ls=f,d}();}));const O={dateFormat:"HH:mm:ss",formatOptions:{date:!0,colors:!1,compact:!0}},M=u=>u?`[${u}]`:"";class S{constructor(u){this.options=Object.assign({},O,u);}formatStack(u){return "  "+A(u).join("\n  ")}formatArgs(u){const e=u.map(u=>u&&"string"==typeof u.stack?u.message+"\n"+this.formatStack(u.stack):u);return "function"==typeof D.formatWithOptions?D.formatWithOptions(this.options.formatOptions,...e):D.format(...e)}formatDate(u){return this.options.formatOptions.date?function(u,D){return w(D).format(u)}(this.options.dateFormat,u):""}filterAndJoin(u){return u.filter(u=>u).join(" ")}formatLogObj(u){const D=this.formatArgs(u.args);return this.filterAndJoin([M(u.type),M(u.tag),D])}log(u,{async:D,stdout:e,stderr:r}={}){return function(u,D,e="default"){const r=D.__write||D.write;switch(e){case"async":return new Promise(e=>{!0===r.call(D,u)?e():D.once("drain",()=>{e();});});case"sync":return t.writeSync(D.fd,u);default:return r.call(D,u)}}(this.formatLogObj(u,{width:e.columns||0})+"\n",u.level<2?r:e,D?"async":"default")}}var I=u=>"string"==typeof u?u.replace((({onlyFirst:u=!1}={})=>{const D=["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)","(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"].join("|");return new RegExp(D,u?void 0:"g")})(),""):u;const k=u=>!Number.isNaN(u)&&(u>=4352&&(u<=4447||9001===u||9002===u||11904<=u&&u<=12871&&12351!==u||12880<=u&&u<=19903||19968<=u&&u<=42182||43360<=u&&u<=43388||44032<=u&&u<=55203||63744<=u&&u<=64255||65040<=u&&u<=65049||65072<=u&&u<=65131||65281<=u&&u<=65376||65504<=u&&u<=65510||110592<=u&&u<=110593||127488<=u&&u<=127569||131072<=u&&u<=262141));var R=k,T=k;R.default=T;const L=u=>{if("string"!=typeof(u=u.replace(/\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g,"  "))||0===u.length)return 0;u=I(u);let D=0;for(let e=0;e<u.length;e++){const t=u.codePointAt(e);t<=31||t>=127&&t<=159||(t>=768&&t<=879||(t>65535&&e++,D+=R(t)?2:1));}return D};var $=L,x=L;$.default=x;var U=/[|\\{}()[\]^$+*?.]/g,j=function(u){if("string"!=typeof u)throw new TypeError("Expected a string");return u.replace(U,"\\$&")};const{platform:P}=process,N={tick:"✔",cross:"✖",star:"★",square:"▇",squareSmall:"◻",squareSmallFilled:"◼",play:"▶",circle:"◯",circleFilled:"◉",circleDotted:"◌",circleDouble:"◎",circleCircle:"ⓞ",circleCross:"ⓧ",circlePipe:"Ⓘ",circleQuestionMark:"?⃝",bullet:"●",dot:"․",line:"─",ellipsis:"…",pointer:"❯",pointerSmall:"›",info:"ℹ",warning:"⚠",hamburger:"☰",smiley:"㋡",mustache:"෴",heart:"♥",nodejs:"⬢",arrowUp:"↑",arrowDown:"↓",arrowLeft:"←",arrowRight:"→",radioOn:"◉",radioOff:"◯",checkboxOn:"☒",checkboxOff:"☐",checkboxCircleOn:"ⓧ",checkboxCircleOff:"Ⓘ",questionMarkPrefix:"?⃝",oneHalf:"½",oneThird:"⅓",oneQuarter:"¼",oneFifth:"⅕",oneSixth:"⅙",oneSeventh:"⅐",oneEighth:"⅛",oneNinth:"⅑",oneTenth:"⅒",twoThirds:"⅔",twoFifths:"⅖",threeQuarters:"¾",threeFifths:"⅗",threeEighths:"⅜",fourFifths:"⅘",fiveSixths:"⅚",fiveEighths:"⅝",sevenEighths:"⅞"},q={tick:"√",cross:"×",star:"*",square:"█",squareSmall:"[ ]",squareSmallFilled:"[█]",play:"►",circle:"( )",circleFilled:"(*)",circleDotted:"( )",circleDouble:"( )",circleCircle:"(○)",circleCross:"(×)",circlePipe:"(│)",circleQuestionMark:"(?)",bullet:"*",dot:".",line:"─",ellipsis:"...",pointer:">",pointerSmall:"»",info:"i",warning:"‼",hamburger:"≡",smiley:"☺",mustache:"┌─┐",heart:N.heart,nodejs:"♦",arrowUp:N.arrowUp,arrowDown:N.arrowDown,arrowLeft:N.arrowLeft,arrowRight:N.arrowRight,radioOn:"(*)",radioOff:"( )",checkboxOn:"[×]",checkboxOff:"[ ]",checkboxCircleOn:"(×)",checkboxCircleOff:"( )",questionMarkPrefix:"？",oneHalf:"1/2",oneThird:"1/3",oneQuarter:"1/4",oneFifth:"1/5",oneSixth:"1/6",oneSeventh:"1/7",oneEighth:"1/8",oneNinth:"1/9",oneTenth:"1/10",twoThirds:"2/3",twoFifths:"2/5",threeQuarters:"3/4",threeFifths:"3/5",threeEighths:"3/8",fourFifths:"4/5",fiveSixths:"5/6",fiveEighths:"5/8",sevenEighths:"7/8"};"linux"===P&&(N.questionMarkPrefix="?");const Y="win32"===P?q:N;var H=Object.assign(u=>{if(Y===N)return u;for(const[D,e]of Object.entries(N))e!==Y[D]&&(u=u.replace(new RegExp(j(e),"g"),Y[D]));return u},Y),V=N,W=q;H.main=V,H.windows=W;var G={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]};const z={};for(const u of Object.keys(G))z[G[u]]=u;const Q={rgb:{channels:3,labels:"rgb"},hsl:{channels:3,labels:"hsl"},hsv:{channels:3,labels:"hsv"},hwb:{channels:3,labels:"hwb"},cmyk:{channels:4,labels:"cmyk"},xyz:{channels:3,labels:"xyz"},lab:{channels:3,labels:"lab"},lch:{channels:3,labels:"lch"},hex:{channels:1,labels:["hex"]},keyword:{channels:1,labels:["keyword"]},ansi16:{channels:1,labels:["ansi16"]},ansi256:{channels:1,labels:["ansi256"]},hcg:{channels:3,labels:["h","c","g"]},apple:{channels:3,labels:["r16","g16","b16"]},gray:{channels:1,labels:["gray"]}};var J=Q;for(const u of Object.keys(Q)){if(!("channels"in Q[u]))throw new Error("missing channels property: "+u);if(!("labels"in Q[u]))throw new Error("missing channel labels property: "+u);if(Q[u].labels.length!==Q[u].channels)throw new Error("channel and label counts mismatch: "+u);const{channels:D,labels:e}=Q[u];delete Q[u].channels,delete Q[u].labels,Object.defineProperty(Q[u],"channels",{value:D}),Object.defineProperty(Q[u],"labels",{value:e});}function K(u){const D=function(){const u={},D=Object.keys(J);for(let e=D.length,t=0;t<e;t++)u[D[t]]={distance:-1,parent:null};return u}(),e=[u];for(D[u].distance=0;e.length;){const u=e.pop(),t=Object.keys(J[u]);for(let r=t.length,n=0;n<r;n++){const r=t[n],s=D[r];-1===s.distance&&(s.distance=D[u].distance+1,s.parent=u,e.unshift(r));}}return D}function Z(u,D){return function(e){return D(u(e))}}function X(u,D){const e=[D[u].parent,u];let t=J[D[u].parent][u],r=D[u].parent;for(;D[r].parent;)e.unshift(D[r].parent),t=Z(J[D[r].parent][r],t),r=D[r].parent;return t.conversion=e,t}Q.rgb.hsl=function(u){const D=u[0]/255,e=u[1]/255,t=u[2]/255,r=Math.min(D,e,t),n=Math.max(D,e,t),s=n-r;let o,i;n===r?o=0:D===n?o=(e-t)/s:e===n?o=2+(t-D)/s:t===n&&(o=4+(D-e)/s),o=Math.min(60*o,360),o<0&&(o+=360);const a=(r+n)/2;return i=n===r?0:a<=.5?s/(n+r):s/(2-n-r),[o,100*i,100*a]},Q.rgb.hsv=function(u){let D,e,t,r,n;const s=u[0]/255,o=u[1]/255,i=u[2]/255,a=Math.max(s,o,i),l=a-Math.min(s,o,i),c=function(u){return (a-u)/6/l+.5};return 0===l?(r=0,n=0):(n=l/a,D=c(s),e=c(o),t=c(i),s===a?r=t-e:o===a?r=1/3+D-t:i===a&&(r=2/3+e-D),r<0?r+=1:r>1&&(r-=1)),[360*r,100*n,100*a]},Q.rgb.hwb=function(u){const D=u[0],e=u[1];let t=u[2];const r=Q.rgb.hsl(u)[0],n=1/255*Math.min(D,Math.min(e,t));return t=1-1/255*Math.max(D,Math.max(e,t)),[r,100*n,100*t]},Q.rgb.cmyk=function(u){const D=u[0]/255,e=u[1]/255,t=u[2]/255,r=Math.min(1-D,1-e,1-t);return [100*((1-D-r)/(1-r)||0),100*((1-e-r)/(1-r)||0),100*((1-t-r)/(1-r)||0),100*r]},Q.rgb.keyword=function(u){const D=z[u];if(D)return D;let e,t=1/0;for(const D of Object.keys(G)){const s=(n=G[D],((r=u)[0]-n[0])**2+(r[1]-n[1])**2+(r[2]-n[2])**2);s<t&&(t=s,e=D);}var r,n;return e},Q.keyword.rgb=function(u){return G[u]},Q.rgb.xyz=function(u){let D=u[0]/255,e=u[1]/255,t=u[2]/255;D=D>.04045?((D+.055)/1.055)**2.4:D/12.92,e=e>.04045?((e+.055)/1.055)**2.4:e/12.92,t=t>.04045?((t+.055)/1.055)**2.4:t/12.92;return [100*(.4124*D+.3576*e+.1805*t),100*(.2126*D+.7152*e+.0722*t),100*(.0193*D+.1192*e+.9505*t)]},Q.rgb.lab=function(u){const D=Q.rgb.xyz(u);let e=D[0],t=D[1],r=D[2];e/=95.047,t/=100,r/=108.883,e=e>.008856?e**(1/3):7.787*e+16/116,t=t>.008856?t**(1/3):7.787*t+16/116,r=r>.008856?r**(1/3):7.787*r+16/116;return [116*t-16,500*(e-t),200*(t-r)]},Q.hsl.rgb=function(u){const D=u[0]/360,e=u[1]/100,t=u[2]/100;let r,n,s;if(0===e)return s=255*t,[s,s,s];r=t<.5?t*(1+e):t+e-t*e;const o=2*t-r,i=[0,0,0];for(let u=0;u<3;u++)n=D+1/3*-(u-1),n<0&&n++,n>1&&n--,s=6*n<1?o+6*(r-o)*n:2*n<1?r:3*n<2?o+(r-o)*(2/3-n)*6:o,i[u]=255*s;return i},Q.hsl.hsv=function(u){const D=u[0];let e=u[1]/100,t=u[2]/100,r=e;const n=Math.max(t,.01);t*=2,e*=t<=1?t:2-t,r*=n<=1?n:2-n;return [D,100*(0===t?2*r/(n+r):2*e/(t+e)),100*((t+e)/2)]},Q.hsv.rgb=function(u){const D=u[0]/60,e=u[1]/100;let t=u[2]/100;const r=Math.floor(D)%6,n=D-Math.floor(D),s=255*t*(1-e),o=255*t*(1-e*n),i=255*t*(1-e*(1-n));switch(t*=255,r){case 0:return [t,i,s];case 1:return [o,t,s];case 2:return [s,t,i];case 3:return [s,o,t];case 4:return [i,s,t];case 5:return [t,s,o]}},Q.hsv.hsl=function(u){const D=u[0],e=u[1]/100,t=u[2]/100,r=Math.max(t,.01);let n,s;s=(2-e)*t;const o=(2-e)*r;return n=e*r,n/=o<=1?o:2-o,n=n||0,s/=2,[D,100*n,100*s]},Q.hwb.rgb=function(u){const D=u[0]/360;let e=u[1]/100,t=u[2]/100;const r=e+t;let n;r>1&&(e/=r,t/=r);const s=Math.floor(6*D),o=1-t;n=6*D-s,0!=(1&s)&&(n=1-n);const i=e+n*(o-e);let a,l,c;switch(s){default:case 6:case 0:a=o,l=i,c=e;break;case 1:a=i,l=o,c=e;break;case 2:a=e,l=o,c=i;break;case 3:a=e,l=i,c=o;break;case 4:a=i,l=e,c=o;break;case 5:a=o,l=e,c=i;}return [255*a,255*l,255*c]},Q.cmyk.rgb=function(u){const D=u[0]/100,e=u[1]/100,t=u[2]/100,r=u[3]/100;return [255*(1-Math.min(1,D*(1-r)+r)),255*(1-Math.min(1,e*(1-r)+r)),255*(1-Math.min(1,t*(1-r)+r))]},Q.xyz.rgb=function(u){const D=u[0]/100,e=u[1]/100,t=u[2]/100;let r,n,s;return r=3.2406*D+-1.5372*e+-.4986*t,n=-.9689*D+1.8758*e+.0415*t,s=.0557*D+-.204*e+1.057*t,r=r>.0031308?1.055*r**(1/2.4)-.055:12.92*r,n=n>.0031308?1.055*n**(1/2.4)-.055:12.92*n,s=s>.0031308?1.055*s**(1/2.4)-.055:12.92*s,r=Math.min(Math.max(0,r),1),n=Math.min(Math.max(0,n),1),s=Math.min(Math.max(0,s),1),[255*r,255*n,255*s]},Q.xyz.lab=function(u){let D=u[0],e=u[1],t=u[2];D/=95.047,e/=100,t/=108.883,D=D>.008856?D**(1/3):7.787*D+16/116,e=e>.008856?e**(1/3):7.787*e+16/116,t=t>.008856?t**(1/3):7.787*t+16/116;return [116*e-16,500*(D-e),200*(e-t)]},Q.lab.xyz=function(u){let D,e,t;e=(u[0]+16)/116,D=u[1]/500+e,t=e-u[2]/200;const r=e**3,n=D**3,s=t**3;return e=r>.008856?r:(e-16/116)/7.787,D=n>.008856?n:(D-16/116)/7.787,t=s>.008856?s:(t-16/116)/7.787,D*=95.047,e*=100,t*=108.883,[D,e,t]},Q.lab.lch=function(u){const D=u[0],e=u[1],t=u[2];let r;r=360*Math.atan2(t,e)/2/Math.PI,r<0&&(r+=360);return [D,Math.sqrt(e*e+t*t),r]},Q.lch.lab=function(u){const D=u[0],e=u[1],t=u[2]/360*2*Math.PI;return [D,e*Math.cos(t),e*Math.sin(t)]},Q.rgb.ansi16=function(u,D=null){const[e,t,r]=u;let n=null===D?Q.rgb.hsv(u)[2]:D;if(n=Math.round(n/50),0===n)return 30;let s=30+(Math.round(r/255)<<2|Math.round(t/255)<<1|Math.round(e/255));return 2===n&&(s+=60),s},Q.hsv.ansi16=function(u){return Q.rgb.ansi16(Q.hsv.rgb(u),u[2])},Q.rgb.ansi256=function(u){const D=u[0],e=u[1],t=u[2];if(D===e&&e===t)return D<8?16:D>248?231:Math.round((D-8)/247*24)+232;return 16+36*Math.round(D/255*5)+6*Math.round(e/255*5)+Math.round(t/255*5)},Q.ansi16.rgb=function(u){let D=u%10;if(0===D||7===D)return u>50&&(D+=3.5),D=D/10.5*255,[D,D,D];const e=.5*(1+~~(u>50));return [(1&D)*e*255,(D>>1&1)*e*255,(D>>2&1)*e*255]},Q.ansi256.rgb=function(u){if(u>=232){const D=10*(u-232)+8;return [D,D,D]}let D;u-=16;return [Math.floor(u/36)/5*255,Math.floor((D=u%36)/6)/5*255,D%6/5*255]},Q.rgb.hex=function(u){const D=(((255&Math.round(u[0]))<<16)+((255&Math.round(u[1]))<<8)+(255&Math.round(u[2]))).toString(16).toUpperCase();return "000000".substring(D.length)+D},Q.hex.rgb=function(u){const D=u.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);if(!D)return [0,0,0];let e=D[0];3===D[0].length&&(e=e.split("").map(u=>u+u).join(""));const t=parseInt(e,16);return [t>>16&255,t>>8&255,255&t]},Q.rgb.hcg=function(u){const D=u[0]/255,e=u[1]/255,t=u[2]/255,r=Math.max(Math.max(D,e),t),n=Math.min(Math.min(D,e),t),s=r-n;let o,i;return o=s<1?n/(1-s):0,i=s<=0?0:r===D?(e-t)/s%6:r===e?2+(t-D)/s:4+(D-e)/s,i/=6,i%=1,[360*i,100*s,100*o]},Q.hsl.hcg=function(u){const D=u[1]/100,e=u[2]/100,t=e<.5?2*D*e:2*D*(1-e);let r=0;return t<1&&(r=(e-.5*t)/(1-t)),[u[0],100*t,100*r]},Q.hsv.hcg=function(u){const D=u[1]/100,e=u[2]/100,t=D*e;let r=0;return t<1&&(r=(e-t)/(1-t)),[u[0],100*t,100*r]},Q.hcg.rgb=function(u){const D=u[0]/360,e=u[1]/100,t=u[2]/100;if(0===e)return [255*t,255*t,255*t];const r=[0,0,0],n=D%1*6,s=n%1,o=1-s;let i=0;switch(Math.floor(n)){case 0:r[0]=1,r[1]=s,r[2]=0;break;case 1:r[0]=o,r[1]=1,r[2]=0;break;case 2:r[0]=0,r[1]=1,r[2]=s;break;case 3:r[0]=0,r[1]=o,r[2]=1;break;case 4:r[0]=s,r[1]=0,r[2]=1;break;default:r[0]=1,r[1]=0,r[2]=o;}return i=(1-e)*t,[255*(e*r[0]+i),255*(e*r[1]+i),255*(e*r[2]+i)]},Q.hcg.hsv=function(u){const D=u[1]/100,e=D+u[2]/100*(1-D);let t=0;return e>0&&(t=D/e),[u[0],100*t,100*e]},Q.hcg.hsl=function(u){const D=u[1]/100,e=u[2]/100*(1-D)+.5*D;let t=0;return e>0&&e<.5?t=D/(2*e):e>=.5&&e<1&&(t=D/(2*(1-e))),[u[0],100*t,100*e]},Q.hcg.hwb=function(u){const D=u[1]/100,e=D+u[2]/100*(1-D);return [u[0],100*(e-D),100*(1-e)]},Q.hwb.hcg=function(u){const D=u[1]/100,e=1-u[2]/100,t=e-D;let r=0;return t<1&&(r=(e-t)/(1-t)),[u[0],100*t,100*r]},Q.apple.rgb=function(u){return [u[0]/65535*255,u[1]/65535*255,u[2]/65535*255]},Q.rgb.apple=function(u){return [u[0]/255*65535,u[1]/255*65535,u[2]/255*65535]},Q.gray.rgb=function(u){return [u[0]/100*255,u[0]/100*255,u[0]/100*255]},Q.gray.hsl=function(u){return [0,0,u[0]]},Q.gray.hsv=Q.gray.hsl,Q.gray.hwb=function(u){return [0,100,u[0]]},Q.gray.cmyk=function(u){return [0,0,0,u[0]]},Q.gray.lab=function(u){return [u[0],0,0]},Q.gray.hex=function(u){const D=255&Math.round(u[0]/100*255),e=((D<<16)+(D<<8)+D).toString(16).toUpperCase();return "000000".substring(e.length)+e},Q.rgb.gray=function(u){return [(u[0]+u[1]+u[2])/3/255*100]};const uu={};Object.keys(J).forEach(u=>{uu[u]={},Object.defineProperty(uu[u],"channels",{value:J[u].channels}),Object.defineProperty(uu[u],"labels",{value:J[u].labels});const D=function(u){const D=K(u),e={},t=Object.keys(D);for(let u=t.length,r=0;r<u;r++){const u=t[r];null!==D[u].parent&&(e[u]=X(u,D));}return e}(u);Object.keys(D).forEach(e=>{const t=D[e];uu[u][e]=function(u){const D=function(...D){const e=D[0];if(null==e)return e;e.length>1&&(D=e);const t=u(D);if("object"==typeof t)for(let u=t.length,D=0;D<u;D++)t[D]=Math.round(t[D]);return t};return "conversion"in u&&(D.conversion=u.conversion),D}(t),uu[u][e].raw=function(u){const D=function(...D){const e=D[0];return null==e?e:(e.length>1&&(D=e),u(D))};return "conversion"in u&&(D.conversion=u.conversion),D}(t);});});var Du=uu,eu=s((function(u){const D=(u,D)=>(...e)=>`[${u(...e)+D}m`,e=(u,D)=>(...e)=>{const t=u(...e);return `[${38+D};5;${t}m`},t=(u,D)=>(...e)=>{const t=u(...e);return `[${38+D};2;${t[0]};${t[1]};${t[2]}m`},r=u=>u,n=(u,D,e)=>[u,D,e],s=(u,D,e)=>{Object.defineProperty(u,D,{get:()=>{const t=e();return Object.defineProperty(u,D,{value:t,enumerable:!0,configurable:!0}),t},enumerable:!0,configurable:!0});};let o;const i=(u,D,e,t)=>{void 0===o&&(o=Du);const r=t?10:0,n={};for(const[t,s]of Object.entries(o)){const o="ansi16"===t?"ansi":t;t===D?n[o]=u(e,r):"object"==typeof s&&(n[o]=u(s[D],r));}return n};Object.defineProperty(u,"exports",{enumerable:!0,get:function(){const u=new Map,o={modifier:{reset:[0,0],bold:[1,22],dim:[2,22],italic:[3,23],underline:[4,24],inverse:[7,27],hidden:[8,28],strikethrough:[9,29]},color:{black:[30,39],red:[31,39],green:[32,39],yellow:[33,39],blue:[34,39],magenta:[35,39],cyan:[36,39],white:[37,39],blackBright:[90,39],redBright:[91,39],greenBright:[92,39],yellowBright:[93,39],blueBright:[94,39],magentaBright:[95,39],cyanBright:[96,39],whiteBright:[97,39]},bgColor:{bgBlack:[40,49],bgRed:[41,49],bgGreen:[42,49],bgYellow:[43,49],bgBlue:[44,49],bgMagenta:[45,49],bgCyan:[46,49],bgWhite:[47,49],bgBlackBright:[100,49],bgRedBright:[101,49],bgGreenBright:[102,49],bgYellowBright:[103,49],bgBlueBright:[104,49],bgMagentaBright:[105,49],bgCyanBright:[106,49],bgWhiteBright:[107,49]}};o.color.gray=o.color.blackBright,o.bgColor.bgGray=o.bgColor.bgBlackBright,o.color.grey=o.color.blackBright,o.bgColor.bgGrey=o.bgColor.bgBlackBright;for(const[D,e]of Object.entries(o)){for(const[D,t]of Object.entries(e))o[D]={open:`[${t[0]}m`,close:`[${t[1]}m`},e[D]=o[D],u.set(t[0],t[1]);Object.defineProperty(o,D,{value:e,enumerable:!1});}return Object.defineProperty(o,"codes",{value:u,enumerable:!1}),o.color.close="[39m",o.bgColor.close="[49m",s(o.color,"ansi",()=>i(D,"ansi16",r,!1)),s(o.color,"ansi256",()=>i(e,"ansi256",r,!1)),s(o.color,"ansi16m",()=>i(t,"rgb",n,!1)),s(o.bgColor,"ansi",()=>i(D,"ansi16",r,!0)),s(o.bgColor,"ansi256",()=>i(e,"ansi256",r,!0)),s(o.bgColor,"ansi16m",()=>i(t,"rgb",n,!0)),o}});})),tu=(u,D=process.argv)=>{const e=u.startsWith("-")?"":1===u.length?"-":"--",t=D.indexOf(e+u),r=D.indexOf("--");return -1!==t&&(-1===r||t<r)};const{env:ru}=process;let nu;function su(u){return 0!==u&&{level:u,hasBasic:!0,has256:u>=2,has16m:u>=3}}function ou(u,D){if(0===nu)return 0;if(tu("color=16m")||tu("color=full")||tu("color=truecolor"))return 3;if(tu("color=256"))return 2;if(u&&!D&&void 0===nu)return 0;const e=nu||0;if("dumb"===ru.TERM)return e;if("win32"===process.platform){const u=r.release().split(".");return Number(u[0])>=10&&Number(u[2])>=10586?Number(u[2])>=14931?3:2:1}if("CI"in ru)return ["TRAVIS","CIRCLECI","APPVEYOR","GITLAB_CI"].some(u=>u in ru)||"codeship"===ru.CI_NAME?1:e;if("TEAMCITY_VERSION"in ru)return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(ru.TEAMCITY_VERSION)?1:0;if("GITHUB_ACTIONS"in ru)return 1;if("truecolor"===ru.COLORTERM)return 3;if("TERM_PROGRAM"in ru){const u=parseInt((ru.TERM_PROGRAM_VERSION||"").split(".")[0],10);switch(ru.TERM_PROGRAM){case"iTerm.app":return u>=3?3:2;case"Apple_Terminal":return 2}}return /-256(color)?$/i.test(ru.TERM)?2:/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(ru.TERM)||"COLORTERM"in ru?1:e}tu("no-color")||tu("no-colors")||tu("color=false")||tu("color=never")?nu=0:(tu("color")||tu("colors")||tu("color=true")||tu("color=always"))&&(nu=1),"FORCE_COLOR"in ru&&(nu="true"===ru.FORCE_COLOR?1:"false"===ru.FORCE_COLOR?0:0===ru.FORCE_COLOR.length?1:Math.min(parseInt(ru.FORCE_COLOR,10),3));var iu={supportsColor:function(u){return su(ou(u,u&&u.isTTY))},stdout:su(ou(!0,n.isatty(1))),stderr:su(ou(!0,n.isatty(2)))};var au={stringReplaceAll:(u,D,e)=>{let t=u.indexOf(D);if(-1===t)return u;const r=D.length;let n=0,s="";do{s+=u.substr(n,t-n)+D+e,n=t+r,t=u.indexOf(D,n);}while(-1!==t);return s+=u.substr(n),s},stringEncaseCRLFWithFirstIndex:(u,D,e,t)=>{let r=0,n="";do{const s="\r"===u[t-1];n+=u.substr(r,(s?t-1:t)-r)+D+(s?"\r\n":"\n")+e,r=t+1,t=u.indexOf("\n",r);}while(-1!==t);return n+=u.substr(r),n}};const lu=/(?:\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi,cu=/(?:^|\.)(\w+)(?:\(([^)]*)\))?/g,hu=/^(['"])((?:\\.|(?!\1)[^\\])*)\1$/,Fu=/\\(u(?:[a-f\d]{4}|{[a-f\d]{1,6}})|x[a-f\d]{2}|.)|([^\\])/gi,Cu=new Map([["n","\n"],["r","\r"],["t","\t"],["b","\b"],["f","\f"],["v","\v"],["0","\0"],["\\","\\"],["e",""],["a",""]]);function fu(u){const D="u"===u[0],e="{"===u[1];return D&&!e&&5===u.length||"x"===u[0]&&3===u.length?String.fromCharCode(parseInt(u.slice(1),16)):D&&e?String.fromCodePoint(parseInt(u.slice(2,-1),16)):Cu.get(u)||u}function Eu(u,D){const e=[],t=D.trim().split(/\s*,\s*/g);let r;for(const D of t){const t=Number(D);if(Number.isNaN(t)){if(!(r=D.match(hu)))throw new Error(`Invalid Chalk template style argument: ${D} (in style '${u}')`);e.push(r[2].replace(Fu,(u,D,e)=>D?fu(D):e));}else e.push(t);}return e}function gu(u){cu.lastIndex=0;const D=[];let e;for(;null!==(e=cu.exec(u));){const u=e[1];if(e[2]){const t=Eu(u,e[2]);D.push([u].concat(t));}else D.push([u]);}return D}function du(u,D){const e={};for(const u of D)for(const D of u.styles)e[D[0]]=u.inverse?null:D.slice(1);let t=u;for(const[u,D]of Object.entries(e))if(Array.isArray(D)){if(!(u in t))throw new Error("Unknown Chalk style: "+u);t=D.length>0?t[u](...D):t[u];}return t}var pu=(u,D)=>{const e=[],t=[];let r=[];if(D.replace(lu,(D,n,s,o,i,a)=>{if(n)r.push(fu(n));else if(o){const D=r.join("");r=[],t.push(0===e.length?D:du(u,e)(D)),e.push({inverse:s,styles:gu(o)});}else if(i){if(0===e.length)throw new Error("Found extraneous } in Chalk template literal");t.push(du(u,e)(r.join(""))),r=[],e.pop();}else r.push(a);}),t.push(r.join("")),e.length>0){const u=`Chalk template literal is missing ${e.length} closing bracket${1===e.length?"":"s"} (\`}\`)`;throw new Error(u)}return t.join("")};const{stdout:mu,stderr:bu}=iu,{stringReplaceAll:yu,stringEncaseCRLFWithFirstIndex:Bu}=au,vu=["ansi","ansi","ansi256","ansi16m"],_u=Object.create(null);class Au{constructor(u){return wu(u)}}const wu=u=>{const D={};return ((u,D={})=>{if(D.level&&!(Number.isInteger(D.level)&&D.level>=0&&D.level<=3))throw new Error("The `level` option should be an integer from 0 to 3");const e=mu?mu.level:0;u.level=void 0===D.level?e:D.level;})(D,u),D.template=(...u)=>Lu(D.template,...u),Object.setPrototypeOf(D,Ou.prototype),Object.setPrototypeOf(D.template,D),D.template.constructor=()=>{throw new Error("`chalk.constructor()` is deprecated. Use `new chalk.Instance()` instead.")},D.template.Instance=Au,D.template};function Ou(u){return wu(u)}for(const[u,D]of Object.entries(eu))_u[u]={get(){const e=ku(this,Iu(D.open,D.close,this._styler),this._isEmpty);return Object.defineProperty(this,u,{value:e}),e}};_u.visible={get(){const u=ku(this,this._styler,!0);return Object.defineProperty(this,"visible",{value:u}),u}};const Mu=["rgb","hex","keyword","hsl","hsv","hwb","ansi","ansi256"];for(const u of Mu)_u[u]={get(){const{level:D}=this;return function(...e){const t=Iu(eu.color[vu[D]][u](...e),eu.color.close,this._styler);return ku(this,t,this._isEmpty)}}};for(const u of Mu){_u["bg"+u[0].toUpperCase()+u.slice(1)]={get(){const{level:D}=this;return function(...e){const t=Iu(eu.bgColor[vu[D]][u](...e),eu.bgColor.close,this._styler);return ku(this,t,this._isEmpty)}}};}const Su=Object.defineProperties(()=>{},{..._u,level:{enumerable:!0,get(){return this._generator.level},set(u){this._generator.level=u;}}}),Iu=(u,D,e)=>{let t,r;return void 0===e?(t=u,r=D):(t=e.openAll+u,r=D+e.closeAll),{open:u,close:D,openAll:t,closeAll:r,parent:e}},ku=(u,D,e)=>{const t=(...u)=>Ru(t,1===u.length?""+u[0]:u.join(" "));return Object.setPrototypeOf(t,Su),t._generator=u,t._styler=D,t._isEmpty=e,t},Ru=(u,D)=>{if(u.level<=0||!D)return u._isEmpty?"":D;let e=u._styler;if(void 0===e)return D;const{openAll:t,closeAll:r}=e;if(-1!==D.indexOf(""))for(;void 0!==e;)D=yu(D,e.close,e.open),e=e.parent;const n=D.indexOf("\n");return -1!==n&&(D=Bu(D,r,t,n)),t+D+r};let Tu;const Lu=(u,...D)=>{const[e]=D;if(!Array.isArray(e))return D.join(" ");const t=D.slice(1),r=[e.raw[0]];for(let u=1;u<e.length;u++)r.push(String(t[u-1]).replace(/[{}\\]/g,"\\$&"),String(e.raw[u]));return void 0===Tu&&(Tu=pu),Tu(u,r.join(""))};Object.defineProperties(Ou.prototype,_u);const $u=Ou();$u.supportsColor=mu,$u.stderr=Ou({level:bu?bu.level:0}),$u.stderr.supportsColor=bu;var xu=$u;const Uu={};function ju(u){let D=Uu[u];return D||(D="#"===u[0]?xu.hex(u):xu[u]||xu.keyword(u),Uu[u]=D,D)}const Pu={};const Nu={info:"cyan"},qu={0:"red",1:"yellow",2:"white",3:"green"},Yu={secondaryColor:"grey",formatOptions:{date:!0,colors:!0,compact:!1}},Hu={info:H("ℹ"),success:H("✔"),debug:H("›"),trace:H("›"),log:""};class Vu extends S{constructor(u){super(Object.assign({},Yu,u));}formatStack(u){const D=ju("grey"),e=ju("cyan");return "\n"+A(u).map(u=>"  "+u.replace(/^at +/,u=>D(u)).replace(/\((.+)\)/,(u,D)=>`(${e(D)})`)).join("\n")}formatType(u,D){const e=Nu[u.type]||qu[u.level]||this.options.secondaryColor;if(D)return function(u){let D=Pu[u];return D||(D="#"===u[0]?xu.bgHex(u):xu["bg"+u[0].toUpperCase()+u.slice(1)]||xu.bgKeyword(u),Pu[u]=D,D)}(e).black(` ${u.type.toUpperCase()} `);const t="string"==typeof Hu[u.type]?Hu[u.type]:u.icon||u.type;return t?ju(e)(t):""}formatLogObj(u,{width:D}){const[e,...t]=this.formatArgs(u.args).split("\n"),r=void 0!==u.badge?Boolean(u.badge):u.level<2,n=ju(this.options.secondaryColor),s=this.formatDate(u.date),o=s&&n(s),i=this.formatType(u,r),a=u.tag?n(u.tag):"",l=e.replace(/`([^`]+)`/g,(u,D)=>xu.cyan(D));let c;const h=this.filterAndJoin([i,l]),F=this.filterAndJoin([a,o]),C=D-$(h)-$(F)-2;return c=C>0&&D>=80?h+" ".repeat(C)+F:h,c+=t.length?"\n"+t.join("\n"):"",r?"\n"+c+"\n":c}}class Wu{constructor({stream:u}={}){this.stream=u||process.stdout;}log(u){this.stream.write(JSON.stringify(u)+"\n");}}const Gu="undefined"!=typeof __non_webpack_require__?__non_webpack_require__:commonjsRequire;class zu{constructor(u){if(u&&u.log)this.logger=u;else {const D=Gu("winston");this.logger=D.createLogger(Object.assign({level:"info",format:D.format.simple(),transports:[new D.transports.Console]},u));}}log(u){const D=[].concat(u.args),e=D.shift();this.logger.log({level:Qu[u.level]||"info",label:u.tag,message:e,args:D,timestamp:u.date.getTime()/1e3});}}const Qu={0:"error",1:"warn",2:"info",3:"verbose",4:"debug",5:"silly"};commonjsGlobal.consola||(commonjsGlobal.consola=function(){let u=p.debug?4:3;process.env.CONSOLA_LEVEL&&(u=parseInt(process.env.CONSOLA_LEVEL)||u);const D=new _({level:u,reporters:[p.ci||p.test?new S:new Vu]});return D.Consola=_,D.BasicReporter=S,D.FancyReporter=Vu,D.JSONReporter=Wu,D.WinstonReporter=zu,D.LogLevel=m,D}());var Ju=commonjsGlobal.consola;var consola=Ju;

var consola$1 = /*@__PURE__*/getDefaultExportFromCjs(consola);

var version = "4.0.0";

const commands = {
  main: () => import('./chunks/main.mjs').then((m) => m.main)
};
const cli = cac("bin-template").version(version);
const handler = (cmdName) => {
  return async function(...args) {
    const cmd = await commands[cmdName]();
    await cmd(...args);
  };
};
cli.command("[word]", "say hello").alias("hi").action(handler("main"));
cli.help();
cli.parse(process.argv);
consola$1.wrapConsole();
process.on("unhandledRejection", (err) => consola$1.error("[unhandledRejection]", err));
process.on("uncaughtException", (err) => consola$1.error("[uncaughtException]", err));
//# sourceMappingURL=cli.mjs.map
