# teip-ts

This is the Typescript clone of [teip](https://github.com/greymd/teip) command.
Exept Oniguruma option(-G) and some type of input, this support original options.

# Future task

- Support Oniguruma Option
- Control input by a single Deno.run
  - For now, Deno.run process is created for each input token.
- Support dryrun

# Test
Use [bats-core](https://github.com/bats-core/bats-core) for test.
For more information, please see [bats-core’s documentation](https://bats-core.readthedocs.io/en/stable/index.html)

```
$ bats ./test/test.sh
```
