require 'rouge'

module Rouge
  module Lexers
    class Chat < RegexLexer
      title "Chat"
      desc "Custom chat syntax highlighting"
      tag 'chat'
      filenames '*.chat'

      #token :Constant,    'kc'
      #token :Declaration, 'kd'
      #token :Namespace,   'kn'
      #token :Pseudo,      'kp'
      #token :Reserved,    'kr'
      #token :Type,        'kt'
      #token :Variable,    'kv'

      state :root do
        # Match role indicators at start of line
        rule %r/^u(ser)?:/, Keyword::Declaration, :expandable
        rule %r/^a(ssistant)?:/, Keyword::Namespace
        rule %r/^err(or)?:/, Error 
        rule %r/^(|tr|tool_result):/, Keyword::Pseudo, :expandable
        rule %r/^(s|system):/, Keyword::Constant, :expandable
        rule %r/^(tc|tool_call):/, Keyword::Reserved

        # Match comments
        rule %r/(?=^c(omment)?:)/, Comment, :comment

        # Match remaining text
        rule %r/./, Text
        rule %r/\s+/, Text::Whitespace
      end
      # Match variables (?<!\\)
      state :expandable do
        rule %r/(?=^(s|system|u|user|a|assistant|tc|tool_call|tr|tool_result|c|comment|err|error):)/, Keyword, :root
        rule %r/\\@/, Text
        rule %r/@{1,2}(?:\{[^}]+\}|\S+)/, Name
        rule %r/./, Text
        rule %r/\s+/, Text::Whitespace
      end
      state :comment do
        rule %r/\\@/, Text
        rule %r/@{1,2}(?:\{[^}]+\}|\S+)/, Name
        rule %r/^c(omment)?:/, Keyword::Constant
        rule %r/(?=^(s|system|u|user|a|assistant|tc|tool_call|tr|tool_result|c|comment|err|error):)/, Keyword, :root
        rule %r/./, Comment
        rule %r/\s+/, Text::Whitespace
      end
    end
  end
end
