## Voice recognition to Drupal node

This project was used in a demo for my presentation on [Drupal and the Internet of Things](https://github.com/eiriksm/dcoslo15-iot) on Drupal Camp Oslo 2015.

It uses the external service for voice recogntion called [Wit](https://wit.ai/) to analyze the voice being recorded and determine if we should either post a picture of a dog or a picture of a cat (or neiher of these).

If you want to add other possible postings you can always open a pull request :)

## Prerequisites

- [Node.js](https://nodejs.org)
- An account and API key on [Wit](https://wit.ai)
- A Drupal site set up in a particular way (rest module and so on `// @todo write more here`)

## Usage

- Copy the default config file to personal config file (For example with `cp default.config.json config.json`)
- Edit the newly created config file (fill in a Drupal site, username, password and a Wit API key).
- Use the module as you wish (or start the default application with `node start.js`).
