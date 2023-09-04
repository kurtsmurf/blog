This project uses [eleventy](https://11ty.dev) to build a static blog website from [blog posts](./posts) authored in markdown.

To build the site run

```Bash
npx @11ty/eleventy
```

To preview the site run

```Bash
npx @11ty/eleventy --serve
```

Both commands output html to the `_site` directory.

To format source code run

```Bash
npx prettier --write .
```
