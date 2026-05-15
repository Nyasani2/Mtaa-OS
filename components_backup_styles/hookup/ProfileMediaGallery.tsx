import {
  View,
  Image,
  ScrollView,
} from "react-native";

interface Props {
  images: string[];
}

export default function ProfileMediaGallery({
  images,
}: Props) {

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        marginTop: 20,
      }}
    >

      {images.map((image, index) => (

        <Image
          key={index}
          source={{ uri: image }}
          style={{
            width: 120,
            height: 180,
            borderRadius: 18,
            marginRight: 14,
          }}
        />

      ))}

    </ScrollView>
  );
}
