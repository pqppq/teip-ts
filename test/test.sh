setup() {
	load 'test_helper/bats-support/load'
	load 'test_helper/bats-assert/load'
	path='../src/main.ts'
}


@test '' {
	run deno run --allow-run $path -c 2-1
	assert_failure
}

@test '' {
	run echo '111\n222\n333\n444\n555\n666\n' | \
	deno run --allow-run $path -l 2,4-5 -- sed 's/./@/'
	assert_equal '111\n@22\n333\n@44\n@55\n666\n'
}

@test '' {
	run echo 'ABC\nDFE\nBCC\nCCA\n' | \
	deno run --allow-run $path -g [AB] -- sed 's/./@/'
	assert_equal '@BC\nDFE\n@CC\n@CA\n'
}

@test '' {
	run echo '118\n119\n120\n121\n' | \
	deno run --allow-run $path -og 2 -- sed 's/./A/'
	assert_equal '118\n119\n1A0\n1A1\n'
}


@test '' {
	run echo 'ABC123EFG\nHIJKLM456' | \
	deno run --allow-run $path -og '\d+' -v -- tr '[:upper:]' '[:lower:]'
	assert_equal 'abc123efg\nhijklm456'
}

@test '' {
	# Use perl -0 instead of sed -z because BSD does not support it.
	run echo 'ABC\nDEF\nGHI\nJKL\n' | \
	deno run --allow-run $path -z -og .\n. -- perl -0 -pnle 's/^./@/;s/.$/%/;'
	assert_equal 'AB@\n%E@\n%H@\n%KL\n'
}

@test '' {
	run echo 'ABC123EFG\0HIJKLM456' | \
	deno run --allow-run $path -zv -og '^...'  -- tr '[:alnum]' '@'
	assert_equal 'ABC@@@@@@\0HIJ@@@@@@'
}

@test '' {
	run echo '120\n121\n' | \
	deno run --allow-run $path  -og '\d' -- sed 's/./AA/g'
	assert_equal 'AAAAAA\nAAAAAA\n'
}

@test '' {
	run echo '111\n222\n333\n444\n555\n666\n'| \
	deno run --allow-run $path -l 2,4-5 -- sed 's/./@/'
	assert_equal '111\n@22\n333\n@44\n@55\n666\n'
}

@test '' {
  run echo 'ABC\nDFE\nBCC\nCCA\n' | \
	deno run --allow-run $path -s -g '[AB]' -- sed 's/./@/'
	assert_equal '@BC\nDFE\n@CC\n@CA\n'
}

@test '' {
	run echo '118\n119\n120\n121\n' | \
	deno run --allow-run $path -s -og 2 -- sed 's/./A/'
	assert_equal '118\n119\n1A0\n1A1\n'
}

@test '' {
	run echo 'ABC123EFG\nHIJKLM456' | \
	deno run --allow-run $path -s -og '\d+' -v -- tr '[:upper:]' '[:lower:]'
	assert_equal 'abc123efg\nhijklm456'
}

@test '' {
	run echo 'ABC123EFG\0\nHIJKLM456' | \
	deno run --allow-run $path -sv -og '\d+' -- tr '[:upper:]' '[:lower:]'
	assert_equal 'abc123efg\0\nhijklm456'
}

@test '' {
	run echo 'ABC\nDEF\nGHI\nJKL\n' | \
	deno run --allow-run $path -sz -og '.\n.' -- perl -pne '$. == 2 and printf "_"'
	assert_equal 'ABC\n_DEF\n_GHI\n_JKL\n'
}

@test '' {
	run echo 'ABC\nDEF\0GHI\nJKL' | \
	deno run --allow-run $path -sz -og '(..\\n..|F.G' -- tr -dc '.'
	assert_equal 'AF\0GL'
}

@test '' {
	run echo 'ABC\nDEF\n\0GHI\nJKL' | \
	deno run --allow-run $path -zvc 1 -- tr '[:alnum:]' '@'
	assert_equal 'A@@\n@@@\n\0G@@\n@@@'
}

@test '' {
	run echo '120\n121\n' | \

	deno run --allow-run $path -s -og '\d' -- sed 's/./AA/g'
	assert_equal 'AAAAAA\nAAAAAA\n'
}

@test '' {
	run echo 'ABC123DEF456\n' | \
	deno run --allow-run $path -Gog '\d+(?=D' -- sed 's/./@/g'
	assert_equal 'ABC@@@DEF456\n'
}

@test '' {
	run echo 'ABC123DEF456\n' | \
	deno run --allow-run $path -v -Gog '\d+(?=D' -- sed, 's/./@/g'
	assert_equal '@@@123@@@@@@\n'
}

@test '' {
	# Use perl -0 instead of sed -z because BSD does not support it.
	run echo 'ABC\nDEF\nGHI\nJKL\n' | \
	deno run --allow-run $path -z -Gog '.\n.' -- perl -0 -pnle 's/^./@/;s/.$/%/;'
	assert_equal 'AB@\n%E@\n%H@\n%KL\n'
}

@test '' {
	run echo 'ABC123EFG\0HIJKLM456' | \
	deno run --allow-run $path -zv -Gog '^...' -- tr '[:alnum:]' '@'
	assert_equal 'ABC@@@@@@\0HIJ@@@@@@'
}

@test '' {
	run echo 'ABC123DEF456\nEFG123ABC456DEF\n' | \
	deno run --allow-run $path -Gog 'C\K\d+(?=D' -- sed 's/./@/g'
	assert_equal 'ABC@@@DEF456\nEFG123ABC@@@DEF\n'
}

@test '' {
	run echo '118\n119\n120\n121\n' | \
	deno run --allow-run $path -s -Gog 2 -- sed 's/./A/'
	assert_equal '118\n119\n1A0\n1A1\n'
}

@test '' {
	run echo 'ABC123EFG\nHIJKLM456' | \
	deno run --allow-run $path -s -Gog '\d+' '-v' -- tr '[:upper:]' '[:lower:]'
	assert_equal 'abc123efg\nhijklm456'
}

@test '' {
	run echo 'ABC123EFG\0\nHIJKLM456' | \
	deno run --allow-run $path -sv -Gog '\d+' -- tr '[:upper:]' '[:lower:]'
	assert_equal 'abc123efg\0\nhijklm456'
}

@test '' {
	run echo 'ABC\nDEF\nGHI\nJKL\n' | \
	deno run --allow-run $path -sz -Gog '.\n.' -- perl -pne '$. == 2 and printf "_"'
	assert_equal 'ABC\n_DEF\n_GHI\n_JKL\n'
}

@test '' {
	run echo 'ABC\nDEF\0GHI\nJKL' | \
	deno run --allow-run $path -sz -Gog '(..\\n..|F.G' -- tr -dc '.'
	assert_equal 'AF\0GL'
}

@test '' {
	run echo '111111111\n222222222\n' | \
	deno run --allow-run $path -c 1-3,6-8 -- sed 's/./A/'
	assert_equal 'A1111A111\nA2222A222\n'
}

@test '' {
	run echo 'ABCEFG\nHIJKLM' | \
	deno run --allow-run $path -c 1,4-6 -v -- tr '[:upper:]' '[:lower:]'
	assert_equal 'AbcEFG\nHijKLM'
}

@test '' {
	run echo '1234\n' | \
	deno run --allow-run $path -c 1,2,4 -- sed 's/./A/'
	assert_equal 'A23A\n' # Not 'AA3A'
}

@test '' {
	run echo '1234\n' | \
	deno run --allow-run $path -c 1,2,4 -- grep 2
	assert_equal '123'
}

@test '' {
	run echo '111111111\n222222222\n' | \
	deno run --allow-run $path -s -c 1-3,6-8 -- sed 's/./A/'
	assert_equal 'A1111A111\nA2222A222\n'
}

@test '' {
	run echo 'ABCEFG\nHIJKLM' | \
	deno run --allow-run $path -s -c 1,4-6 -v -- tr '[:upper:]' '[:lower:]'
	assert_equal 'AbcEFG\nHijKLM'
}

@test '' {
	run echo 'ABC\nDEF\n\0GHI\nJKL' | \
	deno run --allow-run $path -sz -c 1 -- tr '[:alnum:]' '@'
	assert_equal '@BC\nDEF\n\0@HI\nJKL'
}

@test '' {
	run echo 'ABC\nDEF\n\0GHI\nJKL' | \
	deno run --allow-run $path -sz -v -c 1 -- tr '[:alnum:]' '@'
	assert_equal 'A@@\n@@@\n\0G@@\n@@@'
}

@test '' {
	run echo '1234\n' | \
	deno run --allow-run $path -s -c 1,2,4 -- sed 's/./A/'
	assert_equal 'A23A\n' # Not 'AA3A'
}

@test '' {
	run echo '1234\n' | \
	deno run --allow-run $path -s -c 1,2,4 -- grep 2
	assert_equal '123\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path -d , -f 1,2,4 -- sed 's/./_/'
	assert_equal '_AA,_BB,CCC,_DD\n_EE,_FF,GGG,_HH\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path -d , -f 2-4 -- sed 's/./_/'
	assert_equal 'AAA,_BB,_CC,_DD\nEEE,_FF,_GG,_HH\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path -v -d , -f 2-4 -- sed 's/./_/'
	assert_equal '_AA,BBB,CCC,DDD\n_EE,FFF,GGG,HHH\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path -d , -f 3- -- sed 's/./_/'
	assert_equal 'AAA,BBB,_CC,_DD\nEEE,FFF,_GG,_HH\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path -d , -f 3- -- grep G
	assert_equal 'AAA,BBB,GGG,'
}

# This case may be failed in case of debug version somehow. Try release version.
@test '' {
	run echo 'AAA,BBB,CCC,,\nEEE,,GGG,\n' | \
	deno run --allow-run $path -d , -f 3- -- seq 5
	assert_equal 'AAA,BBB,1,2,3\nEEE,,4,5\n'
}

@test '' {
	run echo '1#,2#\n,3#,\0 4#,5#,#6' | \
	deno run --allow-run $path -vz -f 2 -d , -- tr '#', '@'
	assert_equal '1@,2#\n,3@,\0 4@,5#,@6'
}

@test '' {
	run echo '1 2 3 4 5\n' | \
	deno run --allow-run $path -f 1-2,4,5 -- awk '{s+=$0; print s}'
	assert_equal '1 3 3 7 12\n'
}

@test '' {
	run echo '  2\t 3 4 \t  \n' | \
	deno run --allow-run $path -f 3-5 -- sed 's/.*/@@@/g'
	assert_equal '  2\t @@@ @@@ \t  @@@\n'
}

@test '' {
	run echo '  2\t 3 4 \t  \n' | \
	deno run --allow-run $path -f 3-5 -D '[ \t]+' -- awk '{print '@@@'}'
	assert_equal '  2\t @@@ @@@ \t  @@@\n'
}

@test '' {
	run echo '   1  \t 2 \t\t\t3   4\t5\n' | \
	deno run --allow-run $path -f 1-3,6 -- awk '{print $0*2}'
	assert_equal '0   2  \t 4 \t\t\t3   4\t10\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path -s -d , -f 1,2,4 -- sed 's/./_/'
	assert_equal '_AA,_BB,CCC,_DD\n_EE,_FF,GGG,_HH\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path -s -d , -f 2-4 -- sed 's/./_/'
	assert_equal 'AAA,_BB,_CC,_DD\nEEE,_FF,_GG,_HH\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path -s -v -d , -f 2-4 -- sed 's/./_/'
	assert_equal '_AA,BBB,CCC,DDD\n_EE,FFF,GGG,HHH\n'
}

@test '' {
	run echo '1#,2#\n,3#,\0 4#,5#,#6' | \
	deno run --allow-run $path -sz -f 2 -d ,  -- tr '#' '@'
	assert_equal '1#,2@\n,3#,\0 4#,5@,#6'
}

@test '' {
	run echo '1#,2#\n,3#,\0 4#,5#,#6' | \
	deno run --allow-run $path -vsz -f 2 -d ,  -- tr '#' '@'
	assert_equal '1@,2#\n,3@,\0 4@,5#,@6'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path  -- -s -d , -f 3- -- sed 's/./_/'
	assert_equal 'AAA,BBB,_CC,_DD\nEEE,FFF,_GG,_HH\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,DDD\nEEE,FFF,GGG,HHH\n' | \
	deno run --allow-run $path -s -d , -f 3- -- grep G
	assert_equal 'AAA,BBB,,\nEEE,FFF,GGG,\n'
}

@test '' {
	run echo 'AAA,BBB,CCC,,\nEEE,,GGG,\n' | \
	deno run --allow-run $path  -s -d , -f 3- -- grep .
	assert_equal 'AAA,BBB,CCC,,\nEEE,,GGG,\n'
}

@test '' {
	run echo '1 2 3 4 5\n' | \
	deno run --allow-run $path -s -f 1-2,4,5 -- awk '{s+=$0; print s}'
	assert_equal '1 2 3 4 5\n'
}

@test '' {
	run echo '   1  \t 2 \t\t\t3   4\t5\n' | \
	deno run --allow-run $path -s -f 1-3,6 -- awk '{print $0*2}'
	assert_equal '0   2  \t 4 \t\t\t3   4\t10\n'
}

@test '' {
	run echo '  2\t 3 4 \t  \n' | \
	deno run --allow-run $path -s -f 3-5 -- awk "{print \'@@@\'}"
	assert_equal '  2\t @@@ @@@ \t  @@@\n'
}

@test '' {
	run echo '  2\t 3 4 \t  \n' | \
	deno run --allow-run $path -s -f 3-5 -D '[ \t]+' -- awk "{print \'@@@\'}"
	assert_equal '  2\t @@@ @@@ \t  @@@\n'
}
