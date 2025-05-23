function __is_copy_function; functions $argv[1] | sed "s/^function $argv[1]/function $argv[2]/" | source; end
function __is_prompt_start; printf '\e]6973;PS\a'; end
function __is_prompt_end; printf '\e]6973;PE\a'; end

__is_copy_function fish_prompt is_user_prompt

function __is_escape_value
	echo $argv \
	| string replace -a '\\' '\\\\' \
	| string replace -a ';' '\\x3b' \
	| string replace -a \e '\\x1b' \
	| string replace -a \a '\\x07' \
	| string split \n | string join '\x0a' \
	;
end
function __is_update_cwd --on-event fish_prompt; set __is_cwd (__is_escape_value "$PWD"); printf "\e]6973;CWD;%s\a" $__is_cwd; end
function __is_report_prompt --on-event fish_prompt; set __is_prompt (__is_escape_value (is_user_prompt)); printf "\e]6973;PROMPT;%s\a" $__is_prompt; end

if [ "$ISTERM_TESTING" = "1" ]
	function is_user_prompt; printf '> '; end
end

function fish_prompt;
    set --local __user_prompt_lines (is_user_prompt)
    set --local __user_prompt (string join '\n' $__user_prompt_lines)
	set --local __prompt (string join '' (__is_prompt_start) $__user_prompt (__is_prompt_end))
    printf $__prompt
end