import os
import tempfile
import unittest
from pathlib import Path

from scripts.check_ownership import (
    check_ownership,
    find_codeowners_file,
    normalize_file_path,
    parse_codeowners,
    pattern_to_regex,
)


class TestCheckOwnership(unittest.TestCase):

    def test_normalize_file_path(self):
        self.assertEqual(normalize_file_path("./foo/bar.txt"), "foo/bar.txt")
        self.assertEqual(normalize_file_path("/foo/bar.txt"), "foo/bar.txt")
        self.assertEqual(normalize_file_path("foo\\bar.txt"), "foo/bar.txt")

    def test_pattern_to_regex_wildcard(self):
        regex = pattern_to_regex("*")
        self.assertTrue(regex.match("README.md"))
        self.assertTrue(regex.match("src/main.py"))

    def test_pattern_to_regex_extension(self):
        regex = pattern_to_regex("*.js")
        self.assertTrue(regex.match("index.js"))
        self.assertTrue(regex.match("src/index.js"))
        self.assertFalse(regex.match("index.py"))

    def test_pattern_to_regex_anchored_directory(self):
        regex = pattern_to_regex("/docs/")
        self.assertTrue(regex.match("docs/README.md"))
        self.assertTrue(regex.match("docs/sub/guide.md"))
        self.assertFalse(regex.match("src/docs/README.md"))

    def test_pattern_to_regex_specific_file(self):
        regex = pattern_to_regex("/build/logs/app.log")
        self.assertTrue(regex.match("build/logs/app.log"))
        self.assertFalse(regex.match("build/logs/other.log"))

    def test_codeowners_parsing_and_matching(self):
        codeowners_content = """
# CODEOWNERS file
*                   @global-owner
*.js                @js-owner
/docs/              @docs-team
scripts/*.py        @script-owner
unowned.txt
"""
        with tempfile.NamedTemporaryFile("w+", delete=False, encoding="utf-8") as temp:
            temp.write(codeowners_content)
            temp_path = Path(temp.name)

        try:
            rules = parse_codeowners(temp_path)
            files = [
                "README.md",
                "src/app.js",
                "docs/api.md",
                "scripts/check_ownership.py",
                "unowned.txt",
            ]
            unowned, owners_map = check_ownership(files, rules)

            self.assertEqual(unowned, ["unowned.txt"])
            self.assertEqual(owners_map["README.md"], ["@global-owner"])
            self.assertEqual(owners_map["src/app.js"], ["@js-owner"])
            self.assertEqual(owners_map["docs/api.md"], ["@docs-team"])
            self.assertEqual(owners_map["scripts/check_ownership.py"], ["@script-owner"])
        finally:
            os.remove(temp_path)

    def test_precedence_last_matching_rule(self):
        codeowners_content = """
*                   @default-team
/docs/*             @docs-team
/docs/internal.md   @internal-team
"""
        with tempfile.NamedTemporaryFile("w+", delete=False, encoding="utf-8") as temp:
            temp.write(codeowners_content)
            temp_path = Path(temp.name)

        try:
            rules = parse_codeowners(temp_path)
            files = ["docs/internal.md", "docs/public.md", "src/main.py"]
            unowned, owners_map = check_ownership(files, rules)

            self.assertEqual(unowned, [])
            self.assertEqual(owners_map["docs/internal.md"], ["@internal-team"])
            self.assertEqual(owners_map["docs/public.md"], ["@docs-team"])
            self.assertEqual(owners_map["src/main.py"], ["@default-team"])
        finally:
            os.remove(temp_path)

    def test_find_codeowners_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            orig_dir = os.getcwd()
            try:
                os.chdir(tmpdir)
                self.assertIsNone(find_codeowners_file())

                github_dir = Path(".github")
                github_dir.mkdir()
                co_file = github_dir / "CODEOWNERS"
                co_file.write_text("* @owner\n", encoding="utf-8")

                found = find_codeowners_file()
                self.assertIsNotNone(found)
                self.assertEqual(str(found), ".github/CODEOWNERS")
            finally:
                os.chdir(orig_dir)


if __name__ == "__main__":
    unittest.main()
