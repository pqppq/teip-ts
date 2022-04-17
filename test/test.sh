#!/bin/bash

setup() {
	load 'test_helper/bats-support/load'
	load 'test_helper/bats-assert/load'
	main='../src/main.ts'
}


@test 'fail -c 2-1' {
	run deno run -q --allow-run $main -c 2-1
	assert_failure
}

@test 'fail -c 1-2 -f 1-2' {
	actual=`echo -e '111\n222\n333\n444\n555\n666' | deno run -q --allow-run $main -l 2,4-5 -- sed 's/./@/'`
	expected=`echo -e '111\n@22\n333\n@44\n@55\n666\n'`
	assert_equal "$actual" "$expected"
}

@test '-l' {
actual=`echo -e '111\n222\n333\n444\n555\n666' | deno run -q --allow-run $main -l 2,4-5 -- sed 's/./@/'`
expected=`echo -e '111\n@22\n333\n@44\n@55\n666\n'`
assert_equal "$actual" "$expected"
}

@test '-l -v' {
actual=`echo -e '111\n222\n333\n444\n555\n666' | deno run -q --allow-run $main -l 2,4-5 -v -- sed 's/./@/'`
expected=`echo -e '@11\n222\n@33\n444\n555\n@66\n'`
assert_equal "$actual" "$expected"
}

@test '-g' {
	actual=`echo -e 'ABC\nDFE\nBCC\nCCA\n' | deno run -q --allow-run $main -g '[AB]' -- sed 's/./@/'`
	expected=`echo -e '@BC\nDFE\n@CC\n@CA\n'`
	assert_equal "$actual" "$expected"
}

@test '-g -v' {
	actual=`echo -e 'ABC\nDFE\nBCC\nCCA\n' | deno run -q --allow-run $main -g '[AB]' -v -- sed 's/./@/'`
	expected=`echo -e 'ABC\n@FE\nBCC\nCCA\n'`
	assert_equal "$actual" "$expected"
}

@test '-og' {
	actual=`echo -e '118\n119\n120\n121\n' | deno run -q --allow-run $main -og 2 -- sed 's/./A/'`
	expected=`echo -e '118\n119\n1A0\n1A1\n'`
	assert_equal "$actual" "$expected"
}


@test '-og -v' {
	actual=`echo -e 'ABC123EFG\nHIJKLM456' | deno run -q --allow-run $main -og '\d+' -v -- tr '[:upper:]' '[:lower:]'`
	expected=`echo -e 'abc123efg\nhijklm456'`
	assert_equal "$actual" "$expected"
}

@test '-og -z' {
	# Use perl -0 instead of sed -z because BSD does not support it.
	actual=`echo -e 'ABC\nDEF\nGHI\nJKL\n' | deno run -q --allow-run $main -z -og .\n. -- perl -0 -pnle 's/^./@/;s/.$/%/;'`
	expected=`echo -e 'AB@\n%E@\n%H@\n%KL\n'`
	assert_equal "$actual" "$expected"
}

@test '-og -zv' {
	actual=`echo -e 'ABC123EFG\0HIJKLM456' | deno run -q --allow-run $main -zv -og '^...'  -- tr '[:alnum]' '@'`
	expected=`echo -e 'ABC@@@@@@\0HIJ@@@@@@'`
	assert_equal "$actual" "$expected"
}

@test '-og \d' {
	actual=`echo -e '120\n121\n' | deno run -q --allow-run $main  -og '\d' -- sed 's/./AA/g'`
	expected=`echo -e 'AAAAAA\nAAAAAA\n'`
	assert_equal "$actual" "$expected"
}

@test '-g -s' {
  actual=`echo -e 'ABC\nDFE\nBCC\nCCA\n' | deno run -q --allow-run $main -s -g '[AB]' -- sed 's/./@/'`
	expected=`echo -e '@BC\nDFE\n@CC\n@CA\n'`
	assert_equal "$actual" "$expected"
}

@test '-og 2 -s' {
	actual=`echo -e '118\n119\n120\n121\n' | deno run -q --allow-run $main -s -og 2 -- sed 's/./a/'`
	expected=`echo -e '118\n119\n1a0\n1a1\n'`
	assert_equal "$actual" "$expected"
}

@test '-og \d -s' {
	actual=`echo -e '120\n121\n' | deno run -q --allow-run $main -s -og '\d' -- sed 's/./AA/g'`
	expected=`echo -e 'AAAAAA\nAAAAAA\n'`
	assert_equal "$actual" "$expected"
}

@test '-og \d -sv' {
	actual=`echo -e 'ABC123EFG\nHIJKLM456' | deno run -q --allow-run $main -s -og '\d+' -v -- tr '[:upper:]' '[:lower:]'`
	expected=`echo -e 'abc123efg\nhijklm456'`
	assert_equal "$actual" "$expected"
}

@test '-og .\n. -sz' {
	actual=`echo -e 'ABC\nDEF\nGHI\nJKL\n' | deno run -q --allow-run $main -sz -og '.\n.' -- perl -pne '$. == 2 and printf "_"'`
	expected=`echo -e 'ABC\n_DEF\n_GHI\n_JKL\n'`
	assert_equal "$actual" "$expected"
}

@test '-og (..\n..|F.G) -sz' {
	actual=`echo -e 'ABC\nDEF\0GHI\nJKL' | deno run -q --allow-run $main -sz -og '(..\n..|F.G)' -- tr -dc '.'`
	expected=`echo -e 'AF\0GL'`
	assert_equal "$actual" "$expected"
}

@test '-zvc' {
	actual=`echo -e 'ABC\nDEF\n\0GHI\nJKL' | deno run -q --allow-run $main -zvc 1 -- tr '[:alnum:]' '@'`
	expected=`echo -e 'A@@\n@@@\n\0G@@\n@@@'`
	assert_equal "$actual" "$expected"
}

@test '-Gog \d+(?=D)' {
	actual=`echo -e 'ABC123DEF456\n' | deno run -q --allow-run $main -Gog '\d+(?=D)' -- sed 's/./@/g'`
	expected=`echo -e 'ABC@@@DEF456\n'`
	assert_equal "$actual" "$expected"
}

@test '-Gog C\K\d+(?=D)' {
	actual=`echo -e 'ABC123DEF456\nEFG123ABC456DEF\n' | deno run -q --allow-run $main -Gog 'C\K\d+(?=D)' -- sed 's/./@/g'`
	expected=`echo -e 'ABC@@@DEF456\nEFG123ABC@@@DEF\n'`
	assert_equal "$actual" "$expected"
}

@test '-Gog -v' {
	actual=`echo -e 'ABC123DEF456\n' | deno run -q --allow-run $main -v -Gog '\d+(?=D)' -- sed, 's/./@/g'`
	expected=`echo -e '@@@123@@@@@@\n'`
	assert_equal "$actual" "$expected"
}

@test '-Gog -z' {
	# Use perl -0 instead of sed -z because BSD does not support it.
	actual=`echo -e 'ABC\nDEF\nGHI\nJKL\n' | deno run -q --allow-run $main -z -Gog '.\n.' -- perl -0 -pnle 's/^./@/;s/.$/%/;'`
	expected=`echo -e 'AB@\n%E@\n%H@\n%KL\n'`
	assert_equal "$actual" "$expected"
}

@test '-Gog -zv' {
	actual=`echo -e 'ABC123EFG\0HIJKLM456' | deno run -q --allow-run $main -zv -Gog '^...' -- tr '[:alnum:]' '@'`
	expected=`echo -e 'ABC@@@@@@\0HIJ@@@@@@'`
	assert_equal "$actual" "$expected"
}


@test '-Gog -s' {
	actual=`echo -e '118\n119\n120\n121\n' | deno run -q --allow-run $main -s -Gog 2 -- sed 's/./A/'`
	expected=`echo -e '118\n119\n1A0\n1A1\n'`
	assert_equal "$actual" "$expected"
}

@test '-Gog \d+ -s' {
	actual=`echo -e 'ABC123EFG\nHIJKLM456' | deno run -q --allow-run $main -s -Gog '\d+' '-v' -- tr '[:upper:]' '[:lower:]'`
	expected=`echo -e 'abc123efg\nhijklm456'`
	assert_equal "$actual" "$expected"
}

@test '-Gog -sv' {
	actual=`echo -e 'ABC123EFG\0\nHIJKLM456' | deno run -q --allow-run $main -sv -Gog '\d+' -- tr '[:upper:]' '[:lower:]'`
	expected=`echo -e 'abc123efg\0\nhijklm456'`
	assert_equal "$actual" "$expected"
}

@test '-Gog -sz' {
	actual=`echo -e 'ABC\nDEF\nGHI\nJKL\n' | deno run -q --allow-run $main -sz -Gog '.\n.' -- perl -pne '$. == 2 and printf "_"'`
	expected=`echo -e 'ABC\n_DEF\n_GHI\n_JKL\n'`
	assert_equal "$actual" "$expected"
}

@test '-Gog -sz (..\n..|f.g)' {
	actual=`echo -e 'ABC\nDEF\0GHI\nJKL' | deno run -q --allow-run $main -sz -Gog '(..\n..|f.g)' -- tr -dc '.'`
	expected=`echo -e 'AF\0GL'`
	assert_equal "$actual" "$expected"
}

@test '-c 1-3,6-8' {
	actual=`echo -e '111111111\n222222222\n' | deno run -q --allow-run $main -c 1-3,6-8 -- sed 's/./A/'`
	expected=`echo -e 'A1111A111\nA2222A222\n'`
	assert_equal "$actual" "$expected"
}

@test '-c 1,4-6 -v' {
	actual=`echo -e 'ABCEFG\nHIJKLM' | deno run -q --allow-run $main -c 1,4-6 -v -- tr '[:upper:]' '[:lower:]'`
	expected=`echo -e 'AbcEFG\nHijKLM'`
	assert_equal "$actual" "$expected"
}

@test '-c 1,2,4 sed' {
	actual=`echo -e '1234\n' | deno run -q --allow-run $main -c 1,2,4 -- sed 's/./A/'`
	expected=`echo -e 'A23A\n'` # Not 'AA3A'
	assert_equal "$actual" "$expected"
}

@test '-c 1,2,4 grep' {
	actual=`echo -e '1234\n' | deno run -q --allow-run $main -c 1,2,4 -- grep 2`
	expected=`echo -e '123'`
	assert_equal "$actual" "$expected"
}

@test '-c 1-3,6-8 -s' {
	actual=`echo -e '111111111\n222222222\n' | deno run -q --allow-run $main -s -c 1-3,6-8 -- sed 's/./A/'`
	expected=`echo -e 'A1111A111\nA2222A222\n'`
	assert_equal "$actual" "$expected"
}

@test '-c 1,4-6 -vs' {
	actual=`echo -e 'ABCEFG\nHIJKLM' | deno run -q --allow-run $main -s -c 1,4-6 -v -- tr '[:upper:]' '[:lower:]'`
	expected=`echo -e 'AbcEFG\nHijKLM'`
	assert_equal "$actual" "$expected"
}

@test '-c 1 -sz' {
	actual=`echo -e 'ABC\nDEF\n\0GHI\nJKL' | deno run -q --allow-run $main -sz -c 1 -- tr '[:alnum:]' '@'`
	expected=`echo -e '@BC\nDEF\n\0@HI\nJKL'`
	assert_equal "$actual" "$expected"
}

@test '-c 1 -szv' {
	actual=`echo -e 'ABC\nDEF\n\0GHI\nJKL' | deno run -q --allow-run $main -sz -v -c 1 -- tr '[:alnum:]' '@'`
	expected=`echo -e 'A@@\n@@@\n\0G@@\n@@@'`
	assert_equal "$actual" "$expected"
}

@test '-c 1,2,4 -sc sed' {
	actual=`echo -e '1234\n' | deno run -q --allow-run $main -s -c 1,2,4 -- sed 's/./A/'`
	expected=`echo -e 'A23A\n'` # Not 'AA3A'
	assert_equal "$actual" "$expected"
}

@test '-c 1,2,4 -sc grep' {
	actual=`echo -e '1234\n' | deno run -q --allow-run $main -s -c 1,2,4 -- grep 2`
	expected=`echo -e '123\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 1,2,4 -d , sed' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -d , -f 1,2,4 -- sed 's/./_/'`
	expected=`echo -e '_AA,_BB,CCC,_DD\n_EE,_FF,GGG,_HH\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 2-4 -d , sed' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -d , -f 2-4 -- sed 's/./_/'`
	expected=`echo -e 'AAA,_BB,_CC,_DD\nEEE,_FF,_GG,_HH\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 2-4 -v -d ,' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -v -d , -f 2-4 -- sed 's/./_/'`
	expected=`echo -e '_AA,BBB,CCC,DDD\n_EE,FFF,GGG,HHH\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 3- -d , sed' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -d , -f 3- -- sed 's/./_/'`
	expected=`echo -e 'AAA,BBB,_CC,_DD\nEEE,FFF,_GG,_HH\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 3- -d , grep' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -d , -f 3- -- grep G`
	expected=`echo -e 'AAA,BBB,GGG,'`
	assert_equal "$actual" "$expected"
}

# This case may be failed in case of debug version somehow. Try release version.
@test '-f 3- -d , seq' {
	actual=`echo -e 'AAA,BBB,CCC,,\nEEE,,GGG,\n' | deno run -q --allow-run $main -d , -f 3- -- seq 5`
	expected=`echo -e 'AAA,BBB,1,2,3\nEEE,,4,5\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 2 -d , -vz tr' {
	actual=`echo -e '1#,2#\n,3#,\0 4#,5#,#6' | deno run -q --allow-run $main -vz -f 2 -d , -- tr '#', '@'`
	expected=`echo -e '1@,2#\n,3@,\0 4@,5#,@6'`
	assert_equal "$actual" "$expected"
}

@test '-f 1-2,4,5 awk' {
	actual=`echo -e '1 2 3 4 5\n' | deno run -q --allow-run $main -f 1-2,4,5 -- awk '{s+=$0; print s}'`
	expected=`echo -e '1 3 3 7 12\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 3-5' {
	actual=`echo -e '  2\t 3 4 \t  \n' | deno run -q --allow-run $main -f 3-5 -- sed 's/.*/@@@/g'`
	expected=`echo -e '  2\t @@@ @@@ \t  @@@\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 3-5 -D' {
	actual=`echo -e '  2\t 3 4 \t  \n' | deno run -q --allow-run $main -f 3-5 -D '[ \t]+' -- awk '{print '@@@'}'`
	expected=`echo -e '  2\t @@@ @@@ \t  @@@\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 1-3,6 awk' {
	actual=`echo -e '   1  \t 2 \t\t\t3   4\t5\n' | deno run -q --allow-run $main -f 1-3,6 -- awk '{print $0*2}'`
	expected=`echo -e '0   2  \t 4 \t\t\t3   4\t10\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 1,2,4 -d , -s' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -s -d , -f 1,2,4 -- sed 's/./_/'`
	expected=`echo -e '_AA,_BB,CCC,_DD\n_EE,_FF,GGG,_HH\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 2-4 -d , -s' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -s -d , -f 2-4 -- sed 's/./_/'`
	expected=`echo -e 'AAA,_BB,_CC,_DD\nEEE,_FF,_GG,_HH\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 2-4 -d , -sv' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -s -v -d , -f 2-4 -- sed 's/./_/'`
	expected=`echo -e '_AA,BBB,CCC,DDD\n_EE,FFF,GGG,HHH\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 2 -d , -sz' {
	actual=`echo -e '1#,2#\n,3#,\0 4#,5#,#6' | deno run -q --allow-run $main -sz -f 2 -d ,  -- tr '#' '@'`
	expected=`echo -e '1#,2@\n,3#,\0 4#,5@,#6'`
	assert_equal "$actual" "$expected"
}

@test '-f 2 -d , -vsz' {
	actual=`echo -e '1#,2#\n,3#,\0 4#,5#,#6' | deno run -q --allow-run $main -vsz -f 2 -d ,  -- tr '#' '@'`
	expected=`echo -e '1@,2#\n,3@,\0 4@,5#,@6'`
	assert_equal "$actual" "$expected"
}

@test '-f 3- -d , -s sed' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -s -d , -f 3- -- sed 's/./_/'`
	expected=`echo -e 'AAA,BBB,_CC,_DD\nEEE,FFF,_GG,_HH\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 3- -d , -s grep G' {
	actual=`echo -e 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | deno run -q --allow-run $main -s -d , -f 3- -- grep G`
	expected=`echo -e 'AAA,BBB,,\nEEE,FFF,GGG,\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 3- -d , -s grep .' {
	actual=`echo -e 'AAA,BBB,CCC,,\nEEE,,GGG,\n' | deno run -q --allow-run $main  -s -d , -f 3- -- grep .`
	expected=`echo -e 'AAA,BBB,CCC,,\nEEE,,GGG,\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 1-2,4,5 -s' {
	actual=`echo -e '1 2 3 4 5\n' | deno run -q --allow-run $main -s -f 1-2,4,5 -- awk '{s+=$0; print s}'`
	expected=`echo -e '1 2 3 4 5\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 1-3,6 -s' {
	actual=`echo -e '   1  \t 2 \t\t\t3   4\t5\n' | deno run -q --allow-run $main -s -f 1-3,6 -- awk '{print $0*2}'`
	expected=`echo -e '0   2  \t 4 \t\t\t3   4\t10\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 3-5 -s' {
	actual=`echo -e '  2\t 3 4 \t  \n' | deno run -q --allow-run $main -s -f 3-5 -- awk "{print \'@@@\'}"`
	expected=`echo -e '  2\t @@@ @@@ \t  @@@\n'`
	assert_equal "$actual" "$expected"
}

@test '-f 3-5 -Ds' {
	actual=`echo -e '  2\t 3 4 \t  \n' | deno run -q --allow-run $main -s -f 3-5 -D '[ \t]+' -- awk "{print \'@@@\'}"`
	expected=`echo -e '  2\t @@@ @@@ \t  @@@\n'`
	assert_equal "$actual" "$expected"
}
