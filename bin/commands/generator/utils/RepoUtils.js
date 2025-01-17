/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
const _ = require('lodash');
const known = require('./known');

module.exports = class RepoUtils {
  /**
   * Transforms repo name or SSH url to an https url
   * @param {string} repo Repo
   */
  static toHTTPRepoUrl(repo) {
    if (repo.startsWith('http')) {
      return repo;
    }
    if (repo.startsWith('git@')) {
      const m = repo.match(/(https?:\/\/([^/]+)\/|git@(.+):)([\w\d-_/]+)(.git)?/);
      return `https://${m[3]}/${m[4]}.git`;
    }
    if (!repo.includes('/')) {
      repo = `datavisyn/${repo}`;
    }
    return `https://github.com/${repo}.git`;
  }

  /**
   * Transforms repo name or http(s) url to an SSH url
   * @param {string} repo Repo
   */
  static toSSHRepoUrl(repo) {
    if (repo.startsWith('git@')) {
      return repo;
    }
    if (repo.startsWith('http')) {
      const m = repo.match(/(https?:\/\/([^/]+)\/|git@(.+):)([\w\d-_/]+)(.git)?/);
      return `git@${m[2]}:${m[4]}.git`;
    }
    if (!repo.includes('/')) {
      repo = `datavisyn/${repo}`;
    }
    return `git@github.com:${repo}.git`;
  }

  /**
   * Transforms repo http(s) url to an SSH url.
   * @param {string} repo Repo.
   */
  static toSSHRepoUrlFromHTTP(repo) {
    if (repo.startsWith('git@')) {
      return repo;
    }
    const m = repo.match(/(https?:\/\/([^/]+)\/|git@(.+):)([\w\d-_/]+)(.git)?/);
    if (m) {
      return `git@${m[2]}:${m[4]}.git`;
    }
    return repo;
  }

  /**
   * Extracts organization and repo names from a SSH or an http url.
   * @param {string} repo Repo.
   */
  static simplifyRepoUrl(repo) {
    // matches http and git urls
    const m = repo.match(/(https?:\/\/[^/]+\/|git@.+:)([\w\d-_/]+)(.git)?/);
    if (m) {
      // just the repo part
      return m[2];
    }
    return repo;
  }

  /**
   * Checks if repo name includes organization. If not it adds `datavisyn/` prefix.
   * @param {string} name Name of the repo.
   */
  static toBaseName(name) {
    if (name.includes('/')) {
      return name;
    }
    return `datavisyn/${name}`;
  }

  /**
   * Extracts repo name and removes `_product` suffix from name.
   * @param {string} basename Repo name optionaly prefixed with the organization name, i.e, `datavisyn/tdp_core`.
   */
  static toCWD(basename) {
    try {
      let match = basename.match(/.*\/(.*)/)[1];
      if (match.endsWith('_product')) {
        match = match.slice(0, -8);
      }
      return match;
    } catch {
      return basename;
    }
  }

  static toRepository(plugin, useSSH) {
    const p = known.plugin.byName(plugin);
    return useSSH ? RepoUtils.RtoSSHRepoUrl(p.repository) : RepoUtils.toHTTPRepoUrl(p.repository);
  }

  /**
   * Parses the `phovea_product.json` file and returns an array of objects containing the repo name and branch
   * @param {{}} product
   */
  static parsePhoveaProduct(product) {
    const names = new Set();
    const repos = [];
    product.forEach((p) => {
      const repo = p.repo || `phovea/${p.name}`;
      if (!names.has(repo)) {
        names.add(repo);
        repos.push({
          repo,
          branch: p.branch || 'main',
        });
      }
      (p.additional || []).forEach((pi) => {
        const repo = pi.repo || `phovea/${pi.name}`;
        if (!names.has(repo)) {
          names.add(repo);
          repos.push({
            repo,
            branch: pi.branch || 'main',
          });
        }
      });
    });
    return repos;
  }

  /**
   * Finds the aliases of the selected modules and libraries.
   * @param {string[]} moduleNames Array of modules, i.e, `['tdp_core']`
   * @param {string[]} libraryNames Array of libraries, i.e, `['d3', 'font-awesome]`
   */
  static toLibraryAliasMap(moduleNames = [], libraryNames = []) {
    const r = {};
    moduleNames.forEach((m) => {
      const plugin = known.plugin.byName(m);
      if (!plugin) {
        console.log('cant find plugin: ', m);
        return;
      }
      libraryNames.push(...(plugin.libraries || []));
    });
    libraryNames.forEach((l) => {
      const lib = known.lib.byName(l);
      if (!lib) {
        console.log('cant find library: ', l);
        return;
      }
      _.merge(r, lib.aliases);
    });
    return r;
  }

  /**
   * Finds the externals of the selected modules and libraries.
   * @param {string[]} moduleNames Array of modules, i.e, `['tdp_core']`
   * @param {string[]} libraryNames Array of libraries, i.e, `['d3', 'font-awesome]`
   */
  static toLibraryExternals(moduleNames = [], libraryNames = []) {
    const r = [];
    moduleNames.forEach((m) => {
      const plugin = known.plugin.byName(m);
      if (!plugin) {
        console.log('cant find plugin: ', m);
        return;
      }
      r.push(...(plugin.externals || []));
      libraryNames.push(...(plugin.libraries || []));
    });
    libraryNames.forEach((l) => {
      const lib = known.lib.byName(l);
      if (!lib) {
        console.log('cant find library: ', l);
        return;
      }
      r.push(lib.name);
      r.push(...(lib.externals || []));
    });
    return Array.from(new Set(r));
  }

  static getOrganization(url) {
    url = url.replace(/\/$/, ''); // remove possibe `/` at the end of url
    const names = url.toLowerCase().split(/\/|:/);
    return names[names.length - 2];
  }
};
