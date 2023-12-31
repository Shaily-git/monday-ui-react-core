import cx from "classnames";
import { FC } from "react";
import styles from "./TipseenImage.module.scss";
import TipseenMedia from "./TipseenMedia/TipseenMedia";

interface TipseenImageProps {
  // Better be required, but it might be a breaking change
  src?: string | undefined;
  // Better be required, but it might be a breaking change
  alt?: string;
  className?: string;
}

const TipseenImage: FC<TipseenImageProps> = ({ src, alt, className }) => {
  return (
    // TODO future breaking change where we remove the TipseenMedia component and we remove TipseenImage?
    <TipseenMedia>
      <img src={src} alt={alt} className={cx(styles.tipseenImage, className)} />
    </TipseenMedia>
  );
};

export default TipseenImage;
