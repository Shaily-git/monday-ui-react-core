import { Visitor } from "@babel/core";
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { printWithCondition } from "../commonProcess/print";
import { isClassNameJsxAttribute } from "../logical/isClassNameJsxAttribute";
import { embedCxCallExpression } from "../wrapWithCxCallExpression";
import { isCxCallExpression } from "../logical/isCxCallExpression";
import { State } from "../../index";
import { isTemplateLiteralNeedToBeSplit } from "../logical/isTemplateLiteralNeedToBeSplit";
import { buildClassnameStringFromTemplateLiteral } from "../templateLiterals/buildClassnameStringFromTemplateLiteral";
import { splitTemplateLiteralClassNames } from "../templateLiterals/splitTemplateLiteralClassNames";

/**
 * 7: These visitors replace classNames inside template strings e.g. `monday-style-avatar_circle--${type}`
 * with `styles[`${camelCase("mondayStyleAvatarCircle"+type)}`]`
 */
export const templateLiteralReplacementVisitors: Visitor<State> = {
  TemplateLiteral: (path: NodePath<t.TemplateLiteral>, state) => {
    printWithCondition(false, "### templateLiteralReplacementVisitors, path.node", path.node);
    printWithCondition(false, "### templateLiteralReplacementVisitors, path.parent", path.parent);

    // TODO or const declaration
    if (
      (path.parentPath.parentPath && isClassNameJsxAttribute(path.parentPath.parentPath)) ||
      isCxCallExpression(path.parent)
    ) {
      // If 'className={...}' then convert to 'className={cx(...)}'
      if (t.isJSXExpressionContainer(path.parent) && !isCxCallExpression(path.parent.expression)) {
        const newPath = embedCxCallExpression(path.parent);
        path.parentPath.replaceWith(newPath);
        printWithCondition(false, "### templateLiteralReplacementVisitors, wrappedWithCxCallExpression");
        return;
      }

      // Split className={cx(`1 2-${type} 3`)} into className={cx("1", `2-${type}`, "3")}
      if (isCxCallExpression(path.parent) && isTemplateLiteralNeedToBeSplit(path.node)) {
        const callExpression = path.parent as t.CallExpression;
        if (callExpression.arguments.some(a => a.type === "TemplateLiteral")) {
          const newPath = splitTemplateLiteralClassNames(callExpression);
          printWithCondition(
            false,
            "### templateLiteralReplacementVisitors, splitTemplateLiteralClassNames, newPath",
            newPath
          );
          path.parentPath.replaceWith(newPath);
          return;
        }
      }
    }

    const modularClassnameString = buildClassnameStringFromTemplateLiteral(path.node, state);
    const modularClassnameNode = modularClassnameString.includes("+")
      ? t.identifier(modularClassnameString)
      : t.stringLiteral(modularClassnameString);

    if (isCxCallExpression(path.parent)) {
      if (modularClassnameString.includes("+")) {
        const newPath = t.memberExpression(
          t.identifier(state.opts.importIdentifier),
          modularClassnameNode,
          t.isIdentifier(modularClassnameNode)
        );
        printWithCondition(
          false,
          "### templateLiteralReplacementVisitors, modularClassnameString",
          modularClassnameString
        );
        printWithCondition(false, "### templateLiteralReplacementVisitors, path.parent", path.parent);
        printWithCondition(
          false,
          "### templateLiteralReplacementVisitors, isCxCallExpression, path.parentPath.parent",
          path.parentPath.parent
        );

        const insertedPaths = path.replaceInline([newPath, t.templateLiteral(path.node.quasis, path.node.expressions)]);
        insertedPaths.forEach(p => {
          p.skip();
          p.getPrevSibling().skip();
        });

        printWithCondition(false, "### templateLiteralReplacementVisitors, replaced with newPath", newPath);

        state.camelCaseImportNeeded = true;
      } else {
        path.replaceWith(modularClassnameNode);
      }
    }

    if (t.isObjectProperty(path.parent)) {
      printWithCondition(
        true,
        "### templateLiteralReplacementVisitors, isObjectProperty, parentNode.value = ",
        path.parent.value
      );
      const overrideNewPath = t.objectProperty(
        modularClassnameNode,
        path.parent.value,
        t.isIdentifier(modularClassnameNode),
        false
      );
      const insertedPaths = path.parentPath.replaceWith(overrideNewPath);
      insertedPaths.forEach(p => {
        p.skip();
        p.getPrevSibling().skip();
      });
    }
  }
};
