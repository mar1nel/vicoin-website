import React, {useEffect, useState} from "react";
import Navbar from "../Components/Navbar";
import CoffeeCard from "../Components/CoffeeCard";
import './ShopPage.scss'

const decorativeImages = [
    {
        src: 'https://images.seeklogo.com/logo-png/45/2/globe-logo-png_seeklogo-459589.png',
        alt: 'Coffee cup',
        width: 340,
        top: -50,
        left: 1550,
        opacity: "80%",
    }
];

// const imageMap = {
//     1: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
//     2: "https://i2.wp.com/www.twosisterscrafting.com/wp-content/uploads/2022/04/coffee-chocolate-chip-cookies-1200-main.jpg",
//     3: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
//     4: "data:image/jpeg;base64,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",
//     5: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
//     6: "https://static.wixstatic.com/media/7fbf02_c9297aaf23b948ba9e2e3e746d326663~mv2.png/v1/fill/w_1000,h_719,al_c,q_90,usm_0.66_1.00_0.01/7fbf02_c9297aaf23b948ba9e2e3e746d326663~mv2.png",
//     7: "https://assets.clevelandclinic.org/transform/185be5d5-7121-44c1-a1c1-4c353442fc46/CoffeeWithLemonl-1084040638-770x533-1_jpg",
//     8: "https://palatesdesire.com/wp-content/uploads/2022/02/iced-coffee-recipe@palates-desire-4-500x500.jpg",
//     9: "https://www.seriouseats.com/thmb/x5dQAByuE9saNvybQ4sjTU1dHG8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/20230621-SEA-DalognaCoffee-LorenaMasso-hero-e6a0eb179a2d457fb40c059d91594c35.jpg",
//     10: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlFCIBPb5usET8pS0C2YimlIRODgrNBkZjWg&s",
// };


const defaultImage = "https://images.unsplash.com/photo-1510626176961-4b95f52eff21?auto=format&fit=crop&w=800&q=80";

const ShopPage = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("http://localhost:8080/reports/coffees");
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();          // [{ …, stock, imageUrl }]
                setProducts(data);
            } catch (err) {
                console.error("Failed to load coffees:", err);
            }
        })();
    }, []);

    const inStock    = products.filter(p => p.stock > 0);
    const outOfStock = products.filter(p => p.stock === 0);

    // return (
    //     <>
    //         <Navbar/>
    //
    //         <section className="shop-section">
    //             <div className="wrapper-shop-upper">
    //                 {decorativeImages.map((img, idx) => (
    //                     <img
    //                         key={idx}
    //                         src={img.src}
    //                         alt={img.alt}
    //                         className={`decorative-shop ${img.mirrored ? 'mirrored' : ''}`}
    //                         style={{
    //                             opacity: img.opacity,
    //                             top: img.top,
    //                             left: img.left,
    //                             width: img.width
    //                         }}
    //                     />
    //                 ))}
    //                 <h2 className="shop-title">Featured Blends</h2>
    //                 <div className="cards-grid">
    //                     {products.map((c) => (
    //                         <CoffeeCard
    //                             key={c.id}
    //                             coffeeId={c.id}
    //                             name={c.name}
    //                             description={c.description}
    //                             price={c.price}
    //                             image={imageMap[c.id] || defaultImage}
    //                         />
    //                     ))}
    //                 </div>
    //             </div>
    //         </section>
    //
    //         <section className="shop-section">
    //             <div className="wrapper-shop-down">
    //                 <h2 className="shop-title-down">Discount Picks</h2>
    //                 <div className="cards-grid">
    //                     {products.map((c) => {
    //                         const sid = ((c.id - 1 + 5) % 10) + 1;
    //                         return (
    //                             <CoffeeCard
    //                                 key={c.id}
    //                                 coffeeId={c.id}
    //                                 name={c.name}
    //                                 description={c.description}
    //                                 price={c.price}
    //                                 image={imageMap[sid] || defaultImage}
    //                             />
    //                         );
    //                     })}
    //                 </div>
    //             </div>
    //         </section>
    //
    //         <section className="shop-section">
    //             <div className="wrapper-shop-unavailable">
    //                 <h2 className="shop-title-unavail">No More Available</h2>
    //                 <div className="cards-grid unavailable">
    //                     {products.slice(0, 3).map((c) => (
    //                         <CoffeeCard
    //                             key={c.id}
    //                             coffeeId={c.id}
    //                             name={c.name}
    //                             description={c.description}
    //                             price={c.price}
    //                             image={imageMap[c.id] || defaultImage}
    //                             disabled={true}
    //                         />
    //                     ))}
    //                 </div>
    //             </div>
    //         </section>
    //     </>
    // );

    return (
        <>
            <Navbar />
            <section className="shop-section">
                <div className="wrapper-shop-upper">
                    {decorativeImages.map((img, i) => (
                        <img
                            key={i}
                            src={img.src}
                            alt={img.alt}
                            className={`decorative-shop ${img.mirrored ? "mirrored" : ""}`}
                            style={{
                                opacity: img.opacity,
                                top: img.top,
                                left: img.left,
                                width: img.width,
                            }}
                        />
                    ))}
                    <h2 className="shop-title">Featured Blends</h2>
                    <div className="cards-grid">
                        {inStock.map(c => (
                            <CoffeeCard
                                key={c.id}
                                coffeeId={c.id}
                                name={c.name}
                                description={c.description}
                                price={c.price}
                                stock={c.stock}
                                image={c.imageUrl || defaultImage}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── 2. DISCOUNT PICKS (same items, alt image trick) ─── */}
            {/*<section className="shop-section">*/}
            {/*    <div className="wrapper-shop-down">*/}
            {/*        <h2 className="shop-title-down">Discount Picks</h2>*/}
            {/*        <div className="cards-grid">*/}
            {/*            {inStock.map(c => {*/}
            {/*                // keep your “shift” trick to vary images, but default to imageUrl*/}
            {/*                const sid = ((c.id - 1 + 5) % 10) + 1;*/}
            {/*                const altImage =*/}
            {/*                    products.find(p => p.id === sid)?.imageUrl || defaultImage;*/}
            {/*                return (*/}
            {/*                    <CoffeeCard*/}
            {/*                        key={c.id}*/}
            {/*                        coffeeId={c.id}*/}
            {/*                        name={c.name}*/}
            {/*                        description={c.description}*/}
            {/*                        price={c.price}*/}
            {/*                        stock={c.stock}*/}
            {/*                        image={altImage}*/}
            {/*                    />*/}
            {/*                );*/}
            {/*            })}*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</section>*/}

            {/* ─── 2. DISCOUNT PICKS (rotate images by index) ─── */}
            <section className="shop-section">
                <div className="wrapper-shop-down">
                    <h2 className="shop-title-down">Discount Picks</h2>

                    <div className="cards-grid">
                        {(() => {
                            const items = inStock;
                            if (items.length === 0) return null;

                            // Build a parallel array of safe image URLs
                            const imgs = items.map(p =>
                                (p.imageUrl && p.imageUrl.trim()) || defaultImage
                            );

                            const OFFSET = 5; // your “shift” amount; tweak as you like

                            return items.map((c, i) => {
                                const altImage = imgs[(i + OFFSET) % imgs.length];
                                return (
                                    <CoffeeCard
                                        key={`discount-${c.id}`}
                                        coffeeId={c.id}
                                        name={c.name}
                                        description={c.description}
                                        price={c.price}
                                        stock={c.stock}
                                        image={altImage}
                                    />
                                );
                            });
                        })()}
                    </div>
                </div>
            </section>


            {/* ─── 3. SOLD-OUT ITEMS ──────────────────────── */}
            {outOfStock.length > 0 && (
                <section className="shop-section">
                    <div className="wrapper-shop-unavailable">
                        <h2 className="shop-title-unavail">No More Available</h2>
                        <div className="cards-grid unavailable">
                            {outOfStock.map(c => (
                                <CoffeeCard
                                    key={c.id}
                                    coffeeId={c.id}
                                    name={c.name}
                                    description={c.description}
                                    price={c.price}
                                    stock={c.stock}
                                    image={c.imageUrl || defaultImage}
                                    disabled={true}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );

};

export default ShopPage;